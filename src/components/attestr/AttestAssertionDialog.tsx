import type { NostrEvent } from '@nostrify/nostrify';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { encodeEventPointer } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { AttestationPublishForm } from './AttestationPublishForm';

interface AttestAssertionDialogProps {
  assertionEvent?: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttestAssertionDialog({ assertionEvent, open, onOpenChange }: AttestAssertionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Attest assertion event</DialogTitle>
          <DialogDescription className="break-words">
            {assertionEvent ? formatKind(assertionEvent.kind) : 'Unknown kind'} •{' '}
            <span className="break-all font-mono text-xs">
              {assertionEvent ? encodeEventPointer(assertionEvent) : 'unknown'}
            </span>
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
