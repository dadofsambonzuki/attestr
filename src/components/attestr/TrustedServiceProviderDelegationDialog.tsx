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
import { TrustedServiceProviderDelegationForm } from './TrustedServiceProviderDelegationForm';

interface TrustedServiceProviderDelegationDialogProps {
  existing?: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
  children: ReactNode;
}

export function TrustedServiceProviderDelegationDialog({
  existing,
  open,
  onOpenChange,
  onPublished,
  children,
}: TrustedServiceProviderDelegationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trusted service providers</DialogTitle>
          <DialogDescription>
            Publish kind 10040 delegations so trusted providers can publish Trusted Attestors Lists (30392-30395) for selected kinds.
          </DialogDescription>
        </DialogHeader>

        <TrustedServiceProviderDelegationForm
          existing={existing}
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
