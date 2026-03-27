import { NKinds, type NostrEvent } from '@nostrify/nostrify';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { getAddressCoordinate } from '@/lib/attestation';

interface EventDeletionRequestButtonProps {
  event: NostrEvent;
  onRequested?: () => void;
}

export function EventDeletionRequestButton({ event, onRequested }: EventDeletionRequestButtonProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishDeletionRequest, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  if (user?.pubkey !== event.pubkey) {
    return null;
  }

  const handleRequestDeletion = async () => {
    const tags: string[][] = [
      ['e', event.id],
      ['k', `${event.kind}`],
    ];

    if (NKinds.replaceable(event.kind) || NKinds.addressable(event.kind)) {
      tags.push(['a', getAddressCoordinate(event)]);
    }

    try {
      await publishDeletionRequest({
        kind: 5,
        tags,
        content: `Request deletion for event ${event.id}`,
      });

      toast({
        title: 'Deletion requested',
        description: 'Published a NIP-09 deletion request. Relays and clients may still keep prior copies.',
      });
      setOpen(false);
      onRequested?.();
    } catch (error) {
      toast({
        title: 'Could not request deletion',
        description: error instanceof Error ? error.message : 'Failed to publish deletion request.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Request deletion
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request event deletion?</AlertDialogTitle>
          <AlertDialogDescription>
            This publishes a kind 5 deletion request for this event. Deletion is best-effort across relays and clients.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={handleRequestDeletion} disabled={isPending}>
            {isPending ? 'Requesting...' : 'Request deletion'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
