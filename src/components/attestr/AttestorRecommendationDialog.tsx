import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AttestorRecommendationForm } from './AttestorRecommendationForm';

interface AttestorRecommendationDialogProps {
  recommendedAttestorPubkey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
  children: ReactNode;
}

export function AttestorRecommendationDialog({
  recommendedAttestorPubkey,
  open,
  onOpenChange,
  onPublished,
  children,
}: AttestorRecommendationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recommend this attestor</DialogTitle>
          <DialogDescription>
            Publish this recommendation in both legacy and trusted-list formats.
          </DialogDescription>
        </DialogHeader>

        <AttestorRecommendationForm
          recommendedAttestorPubkey={recommendedAttestorPubkey}
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
