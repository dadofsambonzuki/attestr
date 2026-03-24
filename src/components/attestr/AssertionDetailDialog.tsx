import type { NostrEvent } from '@nostrify/nostrify';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AssertionDetailContent } from './AssertionDetailContent';

interface AssertionDetailDialogProps {
  assertion: NostrEvent;
  children: React.ReactNode;
}

export function AssertionDetailDialog({ assertion, children }: AssertionDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Assertion details</DialogTitle>
          <DialogDescription>
            Review assertion metadata, content, and related discussion.
          </DialogDescription>
        </DialogHeader>

        <AssertionDetailContent assertion={assertion} />
      </DialogContent>
    </Dialog>
  );
}
