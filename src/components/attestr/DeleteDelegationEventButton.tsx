import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { NKinds } from '@nostrify/nostrify';

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
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { getAddressCoordinate } from '@/lib/attestation';

interface DeleteDelegationEventButtonProps {
  event: NostrEvent;
  onDeleted?: () => void;
}

export function DeleteDelegationEventButton({ event, onDeleted }: DeleteDelegationEventButtonProps) {
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    const tags: string[][] = [
      ['e', event.id],
      ['k', `${event.kind}`],
    ];

    if (NKinds.replaceable(event.kind) || NKinds.addressable(event.kind)) {
      tags.push(['a', getAddressCoordinate(event)]);
    }

    try {
      await publishEvent({
        kind: 5,
        tags,
        content: 'Delete trusted service provider delegations',
      });

      toast({
        title: 'Delegations deleted',
        description: 'Published a NIP-09 deletion request for your kind 10040 event.',
      });
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not publish deletion request.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full sm:w-auto text-destructive hover:text-destructive">
          Delete all delegations
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete all delegations?</AlertDialogTitle>
          <AlertDialogDescription>
            This publishes a NIP-09 deletion request for your kind 10040 trusted service provider event. All delegations will be removed. This action is best-effort across relays.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete all delegations'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
