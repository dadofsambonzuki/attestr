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
import { ProficiencyDeclarationForm } from './ProficiencyDeclarationForm';

interface ProficiencyDeclarationDialogProps {
  existing?: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
  children: ReactNode;
}

export function ProficiencyDeclarationDialog({
  existing,
  open,
  onOpenChange,
  onPublished,
  children,
}: ProficiencyDeclarationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit proficiency declaration</DialogTitle>
          <DialogDescription>
            Publish your proficiency declaration in both legacy and trusted-list formats.
          </DialogDescription>
        </DialogHeader>

        <ProficiencyDeclarationForm
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
