import type { NostrEvent } from '@nostrify/nostrify';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTrustedAttestorsForKind } from '@/hooks/useTrustedAttestorsForKind';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { parseAttestation, toUnixTimestamp, type AttestationStatus } from '@/lib/attestation';
import { NoteContent } from '@/components/NoteContent';
import { encodeEventPointer, encodeNpub, getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { AssertionPreview } from './AssertionPreview';
import { AttestationZapStats } from './AttestationZapStats';
import { ATTESTATION_STATUS_DESCRIPTIONS } from '@/lib/attestation';
import { AttestationStatusLabel } from './AttestationStatusBadge';
import { EventDeletionRequestButton } from './EventDeletionRequestButton';

interface AttestationDetailContentProps {
  attestation: NostrEvent;
  assertion?: NostrEvent;
  onUpdated?: () => void;
  initialSection?: 'overview' | 'zaps' | 'comments';
}

const lifecycleActions: { label: string; status: AttestationStatus }[] = [
  { label: 'Set verifying', status: 'verifying' },
  { label: 'Set valid', status: 'valid' },
  { label: 'Set invalid', status: 'invalid' },
  { label: 'Revoke', status: 'revoked' },
];

export function AttestationDetailContent({ attestation, assertion, onUpdated, initialSection = 'overview' }: AttestationDetailContentProps) {
  const parsed = parseAttestation(attestation);
  const attestationPointer = encodeEventPointer(attestation);
  const attestorNpub = encodeNpub(attestation.pubkey);
  const attestor = useAuthor(attestation.pubkey);
  const attestorName = getNostrDisplayName(attestor.data?.metadata, attestation.pubkey);
  const attestorAvatar = attestor.data?.metadata?.picture;
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();

  const assertionKind = assertion?.kind;
  const trustedAttestorsQuery = useTrustedAttestorsForKind(user?.pubkey, assertionKind);
  const isTrustedForAssertionKind = Boolean(
    user?.pubkey &&
    assertionKind !== undefined &&
    trustedAttestorsQuery.data?.includes(attestation.pubkey),
  );
  const { toast } = useToast();

  const canUpdate = user?.pubkey === attestation.pubkey && !!parsed.d;

  const [useDurationMode, setUseDurationMode] = useState(false);
  const [validFromInput, setValidFromInput] = useState('');
  const [validToInput, setValidToInput] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');

  const zapsRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSection === 'zaps') {
      zapsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (initialSection === 'comments') {
      commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialSection]);

  useEffect(() => {
    setValidFromInput(toDateTimeLocalInput(parsed.validFrom));
    setValidToInput(toDateTimeLocalInput(parsed.validTo));
    setUseDurationMode(false);
    setDurationMonths('1');
  }, [attestation.id, parsed.validFrom, parsed.validTo]);

  const createdValue = new Date(attestation.created_at * 1000).toLocaleString();
  const dTagValue = parsed.d ?? 'n/a';
  const validFromValue = parsed.validFrom ? new Date(parsed.validFrom * 1000).toLocaleString() : 'n/a';
  const validToValue = parsed.validTo ? new Date(parsed.validTo * 1000).toLocaleString() : 'n/a';

  const updateStatus = async (status: AttestationStatus) => {
    if (!parsed.d) return;

    const nextTags: string[][] = attestation.tags.filter(
      ([name]) => name !== 's' && name !== 'v' && name !== 'valid_from' && name !== 'valid_to' && name !== 'expiration',
    );
    nextTags.push(['s', status]);

    const validFrom = toUnixTimestamp(validFromInput);
    let validTo: number | undefined;

    if (useDurationMode) {
      const duration = Number.parseInt(durationMonths, 10);
      if (Number.isFinite(duration) && duration > 0) {
        const start = validFrom ?? Math.floor(Date.now() / 1000);
        const startDate = new Date(start * 1000);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        validTo = Math.floor(endDate.getTime() / 1000);
      }
    } else {
      validTo = toUnixTimestamp(validToInput);
    }

    if (validFrom) nextTags.push(['valid_from', `${validFrom}`]);
    if (validTo) {
      nextTags.push(['valid_to', `${validTo}`]);
      nextTags.push(['expiration', `${validTo}`]);
    }

    try {
      await publishEvent({
        kind: attestation.kind,
        tags: nextTags,
        content: attestation.content,
      });

      onUpdated?.();
      toast({
        title: 'Attestation updated',
        description: `Lifecycle set to ${status}.`,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update attestation status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mt-2 space-y-6">
      <div className="rounded-md border bg-muted/30 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Attestation event pointer</p>
        <p className="mt-1 break-all font-mono text-xs text-foreground">{attestationPointer}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{formatKind(attestation.kind)}</Badge>
        <EventDeletionRequestButton event={attestation} onRequested={onUpdated} />
      </div>

      <div className="grid gap-3 rounded-md border p-4">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Attestor</p>
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7 border border-slate-200">
              <AvatarImage src={attestorAvatar} alt={attestorName} />
              <AvatarFallback className="text-[10px]">{attestorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <a
              href={getProfilePath(attestation.pubkey)}
              className="truncate text-sm hover:underline"
            >
              {attestorName}
            </a>
          </div>
          <p className="break-all font-mono text-xs text-muted-foreground">{attestorNpub}</p>
          {isTrustedForAssertionKind ? (
            <Badge className="w-fit bg-emerald-600 text-white hover:bg-emerald-600">Trusted for this assertion kind</Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border bg-background/80 p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</p>
              <div className="mt-1 text-sm break-all">
                <AttestationStatusLabel status={parsed.status} />
              </div>
            </div>
            <div className="rounded-md border bg-background/80 p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">d tag</p>
              <p className="mt-1 text-sm break-all">{dTagValue}</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border bg-background/80 p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Created</p>
              <p className="mt-1 text-sm break-all">{createdValue}</p>
            </div>
            <div className="rounded-md border bg-background/80 p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Valid from</p>
              <p className="mt-1 text-sm break-all">{validFromValue}</p>
            </div>
            <div className="rounded-md border bg-background/80 p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Valid to</p>
              <p className="mt-1 text-sm break-all">{validToValue}</p>
            </div>
          </div>
        </div>

        <div className="mt-1 space-y-2 rounded-md border bg-muted/30 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Attestation message</p>
          <div className="min-w-0 rounded-md border bg-background p-3">
            {attestation.content.trim().length > 0 ? (
              <NoteContent event={attestation} className="text-sm" />
            ) : (
              <p className="text-sm text-muted-foreground">No attestation message provided.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Assertion</p>
        <AssertionPreview event={assertion} status={parsed.status} />
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Lifecycle actions</p>
          <span className="text-xs text-muted-foreground">Actions by attestor</span>
        </div>

        {canUpdate ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {lifecycleActions.map((action) => (
                <div key={action.label} className="space-y-1">
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(action.status)}
                    disabled={isPending}
                    className="w-full"
                  >
                    {action.label}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {ATTESTATION_STATUS_DESCRIPTIONS[action.status]}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-duration-mode">Use duration mode</Label>
                <Switch
                  id="edit-duration-mode"
                  checked={useDurationMode}
                  onCheckedChange={setUseDurationMode}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-valid-from">From</Label>
                  <Input
                    id="edit-valid-from"
                    type="datetime-local"
                    value={validFromInput}
                    onChange={(e) => setValidFromInput(e.target.value)}
                  />
                </div>

                {useDurationMode ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-duration-months">Duration (months)</Label>
                    <Input
                      id="edit-duration-months"
                      type="number"
                      min={1}
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-valid-to">To</Label>
                    <Input
                      id="edit-valid-to"
                      type="datetime-local"
                      value={validToInput}
                      onChange={(e) => setValidToInput(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only the attestor can update lifecycle state.
          </p>
        )}
      </div>

      <div ref={zapsRef} id="zaps-section">
        <AttestationZapStats event={attestation} />
      </div>

      <div ref={commentsRef} id="comments-section">
        <CommentsSection root={attestation} title="Comments" />
      </div>
    </div>
  );
}

function toDateTimeLocalInput(unix?: number): string {
  if (!unix) return '';

  const date = new Date(unix * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
