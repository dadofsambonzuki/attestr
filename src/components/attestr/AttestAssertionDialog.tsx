import type { NostrEvent } from '@nostrify/nostrify';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { encodeEventPointer } from '@/lib/nostrEncodings';
import { AttestationPublishForm } from './AttestationPublishForm';

interface AttestAssertionDialogProps {
  assertionEvent?: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttestAssertionDialog({ assertionEvent, open, onOpenChange }: AttestAssertionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Attest assertion event</DialogTitle>
          <DialogDescription>
            Kind {assertionEvent?.kind ?? 'unknown'} • {assertionEvent ? encodeEventPointer(assertionEvent) : 'unknown'}
          </DialogDescription>
        </DialogHeader>

        <AttestationPublishForm
          assertionEvent={assertionEvent}
          embedded
          onPublished={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
