import type { NostrEvent } from '@nostrify/nostrify';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { encodeEventPointer } from '@/lib/nostrEncodings';
import { AttestationDetailContent } from './AttestationDetailContent';

interface AttestationDetailSheetProps {
  attestation: NostrEvent;
  assertion?: NostrEvent;
  children?: ReactNode;
  onUpdated?: () => void;
  onDialogOpenChange?: (open: boolean) => void;
  open?: boolean;
  initialSection?: 'overview' | 'zaps' | 'comments';
}

export function AttestationDetailSheet({ attestation, assertion, children, onUpdated, onDialogOpenChange, open, initialSection = 'overview' }: AttestationDetailSheetProps) {
  const attestationPointer = encodeEventPointer(attestation);
  const detailRootId = `attestation-detail-${attestation.id}`;

  const jumpToComments = () => {
    const commentsSection = document.querySelector(`#${detailRootId} #comments-section`) as HTMLElement | null;
    commentsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Attestation details</DialogTitle>
          <DialogDescription>
            Review lifecycle, linked assertion, and social discussion.
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={jumpToComments}>
              Jump to comments
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/attestations/${attestationPointer}`}>View details</Link>
            </Button>
          </div>
        </DialogHeader>

        <div id={detailRootId}>
          <AttestationDetailContent
            attestation={attestation}
            assertion={assertion}
            onUpdated={onUpdated}
            initialSection={initialSection}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
