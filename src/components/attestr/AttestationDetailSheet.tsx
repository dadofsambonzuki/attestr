import type { NostrEvent } from '@nostrify/nostrify';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AttestationDetailContent } from './AttestationDetailContent';

interface AttestationDetailSheetProps {
  attestation: NostrEvent;
  assertion?: NostrEvent;
  children: React.ReactNode;
  onUpdated?: () => void;
  onDialogOpenChange?: (open: boolean) => void;
}

export function AttestationDetailSheet({ attestation, assertion, children, onUpdated, onDialogOpenChange }: AttestationDetailSheetProps) {
  return (
    <Dialog onOpenChange={onDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attestation details</DialogTitle>
          <DialogDescription>
            Review lifecycle, linked assertion, and social discussion.
          </DialogDescription>
        </DialogHeader>

        <AttestationDetailContent attestation={attestation} assertion={assertion} onUpdated={onUpdated} />
      </DialogContent>
    </Dialog>
  );
}
