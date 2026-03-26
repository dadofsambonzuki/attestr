import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

import { Link } from 'react-router-dom';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthor } from '@/hooks/useAuthor';
import { encodeEventPointer, encodeNpub, getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { AssertionContentRenderer } from './AssertionContentRenderer';
import { AttestAssertionDialog } from './AttestAssertionDialog';

interface AttestationRequestDetailDialogProps {
  request: NostrEvent;
  assertion?: NostrEvent;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AttestationRequestDetailDialog({
  request,
  assertion,
  children,
  open,
  onOpenChange,
}: AttestationRequestDetailDialogProps) {
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);

  const requester = useAuthor(request.pubkey);
  const requesterName = getNostrDisplayName(requester.data?.metadata, request.pubkey);
  const requesterAvatar = requester.data?.metadata?.picture;
  const requestPointer = encodeEventPointer(request);

  const requestedAttestors = request.tags
    .filter(([name, value]) => name === 'p' && value)
    .map(([, value]) => value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Attestation request details</DialogTitle>
          <DialogDescription>
            Review the request context, related assertion, and attest directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-6 w-6 border border-slate-200">
                  <AvatarImage src={requesterAvatar} alt={requesterName} />
                  <AvatarFallback className="text-[9px]">{requesterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <a href={getProfilePath(request.pubkey)} className="truncate text-xs font-medium text-slate-800 hover:underline">
                  {requesterName}
                </a>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(request.created_at * 1000).toLocaleString()}</span>
            </div>

            <p className="mt-2 line-clamp-3 text-sm text-slate-700">
              {request.content.trim() || 'No request message.'}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Request</Badge>
              <Button asChild variant="outline" size="sm">
                <Link to={`/${requestPointer}`}>Permalink</Link>
              </Button>
              <Badge variant="secondary" className="font-mono text-[10px]">{encodeNpub(request.pubkey)}</Badge>
            </div>

            {requestedAttestors.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Requested attestors</span>
                {requestedAttestors.map((pubkey) => (
                  <a
                    key={pubkey}
                    href={getProfilePath(pubkey)}
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    {encodeNpub(pubkey)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-slate-200 bg-white/90 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">Assertion event</span>
                <Badge variant="secondary">{assertion ? formatKind(assertion.kind) : 'Unavailable'}</Badge>
              </div>
              <Button size="sm" onClick={() => setAttestDialogOpen(true)} disabled={!assertion}>
                Attest
              </Button>
            </div>

            {assertion ? (
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
                <AssertionContentRenderer event={assertion} mode="summary" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Could not resolve linked assertion event.</p>
            )}
          </div>
        </div>

        <AttestAssertionDialog
          assertionEvent={assertion}
          open={attestDialogOpen}
          onOpenChange={setAttestDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
