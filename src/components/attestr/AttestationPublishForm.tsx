import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { useToast } from '@/hooks/useToast';
import {
  ATTESTATION_KIND,
  ATTESTATION_STATUS_DESCRIPTIONS,
  ATTESTATION_STATUSES,
  type AttestationStatus,
  createAssertionTag,
  createAttestationD,
  toUnixTimestamp,
} from '@/lib/attestation';
import { AttestationStatusLabel } from './AttestationStatusBadge';
import { SignerMismatchWarning } from '@/components/SignerMismatchWarning';

interface AttestationPublishFormProps {
  assertionEvent?: NostrEvent;
  onPublished?: () => void;
  embedded?: boolean;
}

export function AttestationPublishForm({ assertionEvent, onPublished, embedded = false }: AttestationPublishFormProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const [status, setStatus] = useState<AttestationStatus>('verifying');
  const [note, setNote] = useState('');

  const [useDurationMode, setUseDurationMode] = useState(false);
  const [validFromInput, setValidFromInput] = useState('');
  const [validToInput, setValidToInput] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');

  const canSubmit = Boolean(user && assertionEvent && status);

  const handlePublish = async () => {
    if (!assertionEvent) {
      toast({
        title: 'No assertion selected',
        description: 'Choose an assertion event before publishing an attestation.',
        variant: 'destructive',
      });
      return;
    }

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

    const tags: string[][] = [
      ['d', createAttestationD(assertionEvent)],
      createAssertionTag(assertionEvent),
      ['s', status],
    ];

    if (validFrom) tags.push(['valid_from', `${validFrom}`]);
    if (validTo) {
      tags.push(['valid_to', `${validTo}`]);
      tags.push(['expiration', `${validTo}`]);
    }

    try {
      await publishEvent({
        kind: ATTESTATION_KIND,
        tags,
        content: note.trim(),
      });

      setNote('');
      onPublished?.();
      toast({
        title: 'Attestation published',
        description: 'Your attestation event is now on Nostr relays.',
      });
    } catch (error) {
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Unable to publish attestation.',
        variant: 'destructive',
      });
    }
  };

  const formBody = (
    <>
        {!user ? (
          <div className="space-y-3 rounded-md border border-dashed p-4 text-sm">
            <p className="text-muted-foreground">Log in to publish attestations.</p>
            <LoginArea />
          </div>
        ) : null}

        <SignerMismatchWarning />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="attestation-status">Status</Label>
            <p className="text-xs text-muted-foreground">
              {ATTESTATION_STATUS_DESCRIPTIONS[status]}
            </p>
            <Select value={status} onValueChange={(value) => setStatus(value as AttestationStatus)}>
              <SelectTrigger id="attestation-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ATTESTATION_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    <AttestationStatusLabel status={item} className="gap-1.5" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="duration-mode">Use duration mode</Label>
            <Switch
              id="duration-mode"
              checked={useDurationMode}
              onCheckedChange={setUseDurationMode}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valid-from">From</Label>
              <Input
                id="valid-from"
                type="datetime-local"
                value={validFromInput}
                onChange={(e) => setValidFromInput(e.target.value)}
              />
            </div>

            {useDurationMode ? (
              <div className="space-y-2">
                <Label htmlFor="duration-months">Duration (months)</Label>
                <Input
                  id="duration-months"
                  type="number"
                  min={1}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="valid-to">To</Label>
                <Input
                  id="valid-to"
                  type="datetime-local"
                  value={validToInput}
                  onChange={(e) => setValidToInput(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="attestation-note">Note</Label>
          <Textarea
            id="attestation-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain why this assertion is trustworthy (or not)."
            className="min-h-[100px]"
          />
        </div>

        <Button disabled={!canSubmit || isPending} onClick={handlePublish} className="w-full gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish attestation
        </Button>
    </>
  );

  if (embedded) {
    return <div className="space-y-5">{formBody}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish Attestation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {formBody}
      </CardContent>
    </Card>
  );
}
