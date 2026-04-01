import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';

import NotFound from './NotFound';
import { AppHeader } from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  ATTESTATION_KIND,
  ATTESTATION_REQUEST_KIND,
  parseAttestation,
  parseAttestationRequest,
  parseAddressCoordinate,
} from '@/lib/attestation';
import { encodeEventPointer, getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { AssertionContentRenderer } from '@/components/attestr/AssertionContentRenderer';
import { AttestAssertionDialog } from '@/components/attestr/AttestAssertionDialog';
import { EventDeletionRequestButton } from '@/components/attestr/EventDeletionRequestButton';
import { DMRequestorButton } from '@/components/attestr/DMRequestorButton';

export default function AttestationRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);

  useSeoMeta({
    title: 'Attestation Request • Attestr',
    description: 'View an attestation request and take action.',
  });

  const query = useQuery({
    queryKey: ['nostr', 'attestation-request-event', id ?? ''],
    queryFn: async () => {
      if (!id) return null;

      const decoded = decodeRequestIdentifier(id);
      if (!decoded) return null;

      if (decoded.type === 'id') {
        const [event] = await nostr.query(
          [{ ids: [decoded.id], kinds: [ATTESTATION_REQUEST_KIND], limit: 1 }],
          { signal: AbortSignal.timeout(6000) },
        );
        return event ?? null;
      }

      const [event] = await nostr.query(
        [{
          kinds: [ATTESTATION_REQUEST_KIND],
          authors: [decoded.pubkey],
          '#d': [decoded.identifier],
          limit: 1,
        }],
        { signal: AbortSignal.timeout(6000) },
      );

      return event ?? null;
    },
  });

  const request = query.data ?? undefined;
  const { data: assertionData } = useAssertionEvents(request ? [request] : []);
  const parsed = request ? parseAttestationRequest(request) : undefined;
  const assertion = parsed?.assertionRef
    ? parsed.assertionRef.type === 'e'
      ? assertionData?.byId[parsed.assertionRef.value]
      : parsed.assertionRef.type === 'a'
        ? assertionData?.byAddress[parsed.assertionRef.value]
        : undefined
    : undefined;

  const requester = useAuthor(request?.pubkey);
  const requesterName = getNostrDisplayName(requester.data?.metadata, request?.pubkey ?? '');
  const requesterAvatar = requester.data?.metadata?.picture;
  const asserterPubkey = assertion?.pubkey;
  const asserter = useAuthor(asserterPubkey);
  const asserterName = asserterPubkey
    ? getNostrDisplayName(asserter.data?.metadata, asserterPubkey)
    : 'Unknown assertor';
  const asserterAvatar = asserter.data?.metadata?.picture;

  const requestedAttestors = request?.tags
    .filter(([name, value]) => name === 'p' && value)
    .map(([, value]) => value) ?? [];

  const existingAttestorsQuery = useQuery({
    queryKey: ['nostr', 'attestation-request-existing-attestors', request?.id ?? ''],
    queryFn: async () => {
      if (!parsed?.assertionRef) return [] as string[];

      const events = await nostr.query([
        parsed.assertionRef.type === 'e'
          ? {
            kinds: [ATTESTATION_KIND],
            '#e': [parsed.assertionRef.value],
            limit: 400,
          }
          : {
            kinds: [ATTESTATION_KIND],
            '#a': [parsed.assertionRef.value],
            limit: 400,
          },
      ], { signal: AbortSignal.timeout(6000) });

      const byPubkey = new Map<string, number>();
      for (const event of events) {
        const parsedAttestation = parseAttestation(event);
        if (!parsedAttestation.assertionRef) continue;
        const previous = byPubkey.get(event.pubkey);
        if (!previous || event.created_at > previous) {
          byPubkey.set(event.pubkey, event.created_at);
        }
      }

      return [...byPubkey.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([pubkey]) => pubkey);
    },
    enabled: !!parsed?.assertionRef,
  });

  const existingAttestors = existingAttestorsQuery.data ?? [];

  if (!id) return <NotFound />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {query.isLoading ? (
          <Card>
            <CardHeader><CardTitle>Loading request</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        ) : !request ? (
          <NotFound />
        ) : (
          <>
            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Attestation Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-7 w-7 border border-slate-200">
                      <AvatarImage src={requesterAvatar} alt={requesterName} />
                      <AvatarFallback className="text-[10px]">{requesterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <a href={getProfilePath(request.pubkey)} className="truncate text-sm font-medium text-slate-800 hover:underline">
                      {requesterName}
                    </a>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(request.created_at * 1000).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-slate-700">
                  {request.content.trim() || 'No request message.'}
                </p>

                <div className="rounded-md border border-slate-200 bg-slate-50/70 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-6 w-6 border border-slate-200">
                      <AvatarImage src={asserterAvatar} alt={asserterName} />
                      <AvatarFallback className="text-[9px]">{asserterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {asserterPubkey ? (
                      <a href={getProfilePath(asserterPubkey)} className="truncate text-sm font-medium text-slate-800 hover:underline">
                        {asserterName}
                      </a>
                    ) : (
                      <span className="truncate text-sm font-medium text-slate-800">{asserterName}</span>
                    )}
                    <span className="text-xs text-muted-foreground">made the assertion</span>
                  </div>
                </div>

                {requestedAttestors.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Requested attestors</span>
                    {requestedAttestors.map((pubkey) => (
                      <RequestedAttestorPill key={pubkey} pubkey={pubkey} />
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
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

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Request</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/requests/${encodeEventPointer(request)}`}>View details</Link>
                  </Button>
                  <DMRequestorButton pubkey={request.pubkey} />
                  <EventDeletionRequestButton event={request} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div className="flex items-center gap-2">
                  <CardTitle>Assertion event</CardTitle>
                  <Badge variant="secondary">{assertion ? formatKind(assertion.kind) : 'Unavailable'}</Badge>
                </div>
                {user ? (
                  <Button size="sm" onClick={() => setAttestDialogOpen(true)} disabled={!assertion}>
                    Attest
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {assertion ? (
                  <AssertionContentRenderer event={assertion} mode="full" />
                ) : (
                  <p className="text-sm text-muted-foreground">Could not resolve linked assertion event.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AttestAssertionDialog
        assertionEvent={assertion}
        open={attestDialogOpen}
        onOpenChange={setAttestDialogOpen}
      />
    </div>
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

function RequestedAttestorPill({ pubkey }: { pubkey: string }) {
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

function decodeRequestIdentifier(value: string):
  | { type: 'id'; id: string }
  | { type: 'address'; pubkey: string; identifier: string }
  | null {
  if (/^[a-f0-9]{64}$/i.test(value)) {
    return { type: 'id', id: value.toLowerCase() };
  }

  try {
    const decoded = nip19.decode(value);
    if (decoded.type === 'nevent') return { type: 'id', id: decoded.data.id };
    if (decoded.type === 'note') return { type: 'id', id: decoded.data };
    if (decoded.type === 'naddr' && decoded.data.kind === ATTESTATION_REQUEST_KIND) {
      return { type: 'address', pubkey: decoded.data.pubkey, identifier: decoded.data.identifier };
    }
  } catch {
    const coord = parseAddressCoordinate(value);
    if (coord && coord.kind === ATTESTATION_REQUEST_KIND) {
      return { type: 'address', pubkey: coord.pubkey, identifier: coord.identifier };
    }
  }

  return null;
}
