import type { NostrEvent } from '@nostrify/nostrify';
import type { ReactNode } from 'react';

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
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AssertionDetailDialog({ assertion, children, open, onOpenChange }: AssertionDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
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
