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
import { AttestationRequestPublishForm } from './AttestationRequestPublishForm';

interface RequestAssertionDialogProps {
  assertionEvent?: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
}

export function RequestAssertionDialog({ assertionEvent, open, onOpenChange, onPublished }: RequestAssertionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request attestation</DialogTitle>
          <DialogDescription className="break-words">
            {assertionEvent ? formatKind(assertionEvent.kind) : 'Unknown kind'} •{' '}
            <span className="break-all font-mono text-xs">
              {assertionEvent ? encodeEventPointer(assertionEvent) : 'unknown'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <AttestationRequestPublishForm
          assertionEvent={assertionEvent}
          embedded
          onPublished={() => {
            onPublished?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
