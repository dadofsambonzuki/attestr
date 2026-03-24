import type { NostrEvent } from '@nostrify/nostrify';
import { useEffect, useMemo, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { ZapButton } from '@/components/ZapButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { parseAttestation, type AttestationStatus } from '@/lib/attestation';
import { NostrName } from '@/components/nostr/NostrName';
import { encodeEventPointer, encodeNpub } from '@/lib/nostrEncodings';
import { AssertionPreview } from './AssertionPreview';
import { AttestationZapStats } from './AttestationZapStats';

interface AttestationDetailContentProps {
  attestation: NostrEvent;
  assertion?: NostrEvent;
  onUpdated?: () => void;
  initialSection?: 'overview' | 'zaps' | 'comments';
}

const lifecycleActions: { label: string; status: AttestationStatus; validity?: 'valid' | 'invalid' }[] = [
  { label: 'Set verifying', status: 'verifying' },
  { label: 'Set verified valid', status: 'verified', validity: 'valid' },
  { label: 'Set verified invalid', status: 'verified', validity: 'invalid' },
  { label: 'Revoke', status: 'revoked' },
];

export function AttestationDetailContent({ attestation, assertion, onUpdated, initialSection = 'overview' }: AttestationDetailContentProps) {
  const parsed = parseAttestation(attestation);
  const attestationPointer = encodeEventPointer(attestation);
  const attestorNpub = encodeNpub(attestation.pubkey);
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const canUpdate = user?.pubkey === attestation.pubkey && !!parsed.d;
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

  const details = useMemo(() => {
    return [
      { label: 'Status', value: parsed.status ?? 'unknown' },
      { label: 'Validity', value: parsed.validity ?? 'n/a' },
      { label: 'Valid from', value: parsed.validFrom ? new Date(parsed.validFrom * 1000).toLocaleString() : 'n/a' },
      { label: 'Valid to', value: parsed.validTo ? new Date(parsed.validTo * 1000).toLocaleString() : 'n/a' },
      { label: 'Created', value: new Date(attestation.created_at * 1000).toLocaleString() },
      { label: 'd tag', value: parsed.d ?? 'n/a' },
    ];
  }, [attestation, parsed]);

  const updateStatus = async (status: AttestationStatus, validity?: 'valid' | 'invalid') => {
    if (!parsed.d) return;

    const nextTags: string[][] = attestation.tags.filter(([name]) => name !== 's' && name !== 'v');
    nextTags.push(['s', status]);
    if (status === 'verified' && validity) {
      nextTags.push(['v', validity]);
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
        <Badge>{parsed.status ?? 'unknown'}</Badge>
        {parsed.validity ? <Badge variant="secondary">{parsed.validity}</Badge> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ZapButton target={attestation} className="text-sm" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Jump to comments
        </Button>
      </div>

      <div className="grid gap-3 rounded-md border p-4">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Attestor</p>
          <p className="text-sm"><NostrName pubkey={attestation.pubkey} /></p>
          <p className="break-all font-mono text-xs text-muted-foreground">{attestorNpub}</p>
        </div>
        {details.map((item) => (
          <div key={item.label} className="grid gap-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="text-sm break-all">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Assertion</p>
        <AssertionPreview event={assertion} />
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Lifecycle actions</p>
          <span className="text-xs text-muted-foreground">Actions by attestor</span>
        </div>

        {canUpdate ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {lifecycleActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                onClick={() => updateStatus(action.status, action.validity)}
                disabled={isPending}
              >
                {action.label}
              </Button>
            ))}
          </div>
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
