import type { NostrEvent } from '@nostrify/nostrify';
import { useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { ZapButton } from '@/components/ZapButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { parseAttestation, type AttestationStatus } from '@/lib/attestation';
import { AssertionPreview } from './AssertionPreview';

interface AttestationDetailSheetProps {
  attestation: NostrEvent;
  assertion?: NostrEvent;
  children: React.ReactNode;
  onUpdated?: () => void;
}

const lifecycleActions: { label: string; status: AttestationStatus; validity?: 'valid' | 'invalid' }[] = [
  { label: 'Set verifying', status: 'verifying' },
  { label: 'Set verified valid', status: 'verified', validity: 'valid' },
  { label: 'Set verified invalid', status: 'verified', validity: 'invalid' },
  { label: 'Revoke', status: 'revoked' },
];

export function AttestationDetailSheet({ attestation, assertion, children, onUpdated }: AttestationDetailSheetProps) {
  const parsed = parseAttestation(attestation);
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const canUpdate = user?.pubkey === attestation.pubkey && !!parsed.d;

  const details = useMemo(() => {
    return [
      { label: 'Status', value: parsed.status ?? 'unknown' },
      { label: 'Validity', value: parsed.validity ?? 'n/a' },
      { label: 'Valid from', value: parsed.validFrom ? new Date(parsed.validFrom * 1000).toLocaleString() : 'n/a' },
      { label: 'Valid to', value: parsed.validTo ? new Date(parsed.validTo * 1000).toLocaleString() : 'n/a' },
      { label: 'Attestor', value: attestation.pubkey },
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
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attestation details</DialogTitle>
          <DialogDescription>
            Review lifecycle, linked assertion, and social discussion.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{parsed.status ?? 'unknown'}</Badge>
            {parsed.validity ? <Badge variant="secondary">{parsed.validity}</Badge> : null}
          </div>

          <div className="grid gap-3 rounded-md border p-4">
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
              <ZapButton target={attestation} className="text-sm" />
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

          <CommentsSection root={attestation} title="Comments" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
