import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

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
import { encodeEventPointer, getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { ATTESTATION_KIND, parseAttestation, parseAttestationRequest } from '@/lib/attestation';
import { AssertionContentRenderer } from './AssertionContentRenderer';
import { AttestAssertionDialog } from './AttestAssertionDialog';
import { EventDeletionRequestButton } from './EventDeletionRequestButton';
import { DMRequestorButton } from './DMRequestorButton';

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
  const { nostr } = useNostr();

  const requester = useAuthor(request.pubkey);
  const requesterName = getNostrDisplayName(requester.data?.metadata, request.pubkey);
  const requesterAvatar = requester.data?.metadata?.picture;
  const asserterPubkey = assertion?.pubkey;
  const asserter = useAuthor(asserterPubkey);
  const asserterName = asserterPubkey
    ? getNostrDisplayName(asserter.data?.metadata, asserterPubkey)
    : 'Unknown assertor';
  const asserterAvatar = asserter.data?.metadata?.picture;
  const requestPointer = encodeEventPointer(request);
  const parsedRequest = parseAttestationRequest(request);

  const existingAttestorsQuery = useQuery({
    queryKey: ['nostr', 'request-detail-dialog-existing-attestors', request.id],
    queryFn: async () => {
      if (!parsedRequest.assertionRef) return [] as string[];

      const events = await nostr.query([
        parsedRequest.assertionRef.type === 'e'
          ? {
            kinds: [ATTESTATION_KIND],
            '#e': [parsedRequest.assertionRef.value],
            limit: 400,
          }
          : {
            kinds: [ATTESTATION_KIND],
            '#a': [parsedRequest.assertionRef.value],
            limit: 400,
          },
      ], { signal: AbortSignal.timeout(6000) });

      const byPubkey = new Map<string, number>();
      for (const event of events) {
        const parsed = parseAttestation(event);
        if (!parsed.assertionRef) continue;
        const previous = byPubkey.get(event.pubkey);
        if (!previous || event.created_at > previous) {
          byPubkey.set(event.pubkey, event.created_at);
        }
      }

      return [...byPubkey.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([pubkey]) => pubkey);
    },
    enabled: !!parsedRequest.assertionRef,
  });

  const existingAttestors = existingAttestorsQuery.data ?? [];

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

            <div className="mt-3 rounded-md border border-slate-200 bg-white/90 p-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-6 w-6 border border-slate-200">
                  <AvatarImage src={asserterAvatar} alt={asserterName} />
                  <AvatarFallback className="text-[9px]">{asserterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {asserterPubkey ? (
                  <a href={getProfilePath(asserterPubkey)} className="truncate text-xs font-medium text-slate-800 hover:underline">
                    {asserterName}
                  </a>
                ) : (
                  <span className="truncate text-xs font-medium text-slate-800">{asserterName}</span>
                )}
                <span className="text-[11px] text-muted-foreground">made the assertion</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Request</Badge>
              <Button asChild variant="outline" size="sm">
                <Link to={`/requests/${requestPointer}`}>View details</Link>
              </Button>
              <DMRequestorButton pubkey={request.pubkey} />
              <EventDeletionRequestButton event={request} />
            </div>

            {requestedAttestors.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Requested attestors</span>
                {requestedAttestors.map((pubkey) => (
                  <RequestedAttestorIdentityPill key={pubkey} pubkey={pubkey} />
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Existing attestors</span>
              {existingAttestors.length > 0 ? (
                <>
                  <span className="text-xs font-medium text-slate-700">{existingAttestors.length}</span>
                  <div className="flex items-center gap-1">
                    {existingAttestors.slice(0, 8).map((pubkey) => (
                      <ExistingAttestorAvatar key={pubkey} pubkey={pubkey} />
                    ))}
                  </div>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">None yet</span>
              )}
            </div>
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

function ExistingAttestorAvatar({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const displayName = getNostrDisplayName(author.data?.metadata, pubkey);
  const avatar = author.data?.metadata?.picture;

  return (
    <a href={getProfilePath(pubkey)} title={displayName} className="inline-flex">
      <Avatar className="h-5 w-5 border border-slate-200">
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="text-[8px]">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    </a>
  );
}

function RequestedAttestorIdentityPill({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const displayName = getNostrDisplayName(author.data?.metadata, pubkey);
  const avatar = author.data?.metadata?.picture;

  return (
    <a
      href={getProfilePath(pubkey)}
      className="inline-flex max-w-[240px] items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
    >
      <Avatar className="h-4 w-4 border border-slate-200">
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="text-[8px]">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="truncate">{displayName}</span>
    </a>
  );
}
