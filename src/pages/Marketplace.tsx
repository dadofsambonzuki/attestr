import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { AppHeader } from '@/components/AppHeader';
import { AssertionSearchPanel } from '@/components/attestr/AssertionSearchPanel';
import { AttestationRequestDetailDialog } from '@/components/attestr/AttestationRequestDetailDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  ATTESTATION_KIND,
  ATTESTATION_REQUEST_KIND,
  ATTESTOR_PROFICIENCY_DECLARATION_KIND,
  parseAttestation,
  parseAttestationRequest,
  parseAttestorProficiencyDeclaration,
} from '@/lib/attestation';
import { getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

export default function Marketplace() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const requestsQuery = useQuery({
    queryKey: ['nostr', 'marketplace-attestation-requests'],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [ATTESTATION_REQUEST_KIND],
          limit: 200,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return groupLatestByPubkeyAndD(events).sort((a, b) => b.created_at - a.created_at);
    },
  });

  const requests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);
  const { data: assertionData } = useAssertionEvents(requests);

  const assertionRefs = useMemo(() => {
    const eRefs = new Set<string>();
    const aRefs = new Set<string>();

    for (const request of requests) {
      const parsed = parseAttestationRequest(request);
      if (!parsed.assertionRef) continue;

      if (parsed.assertionRef.type === 'e') {
        eRefs.add(parsed.assertionRef.value);
      } else {
        aRefs.add(parsed.assertionRef.value);
      }
    }

    return {
      eRefs: [...eRefs.values()],
      aRefs: [...aRefs.values()],
    };
  }, [requests]);

  const requestAttestationsQuery = useQuery({
    queryKey: ['nostr', 'marketplace-attestations-for-requests', assertionRefs.eRefs, assertionRefs.aRefs],
    queryFn: async () => {
      const filters: NostrFilter[] = [];

      if (assertionRefs.eRefs.length > 0) {
        filters.push({
          kinds: [ATTESTATION_KIND],
          '#e': assertionRefs.eRefs,
          limit: 400,
        });
      }

      if (assertionRefs.aRefs.length > 0) {
        filters.push({
          kinds: [ATTESTATION_KIND],
          '#a': assertionRefs.aRefs,
          limit: 400,
        });
      }

      if (filters.length === 0) {
        return [] as NostrEvent[];
      }

      return nostr.query(filters, { signal: AbortSignal.timeout(6000) });
    },
    enabled: assertionRefs.eRefs.length > 0 || assertionRefs.aRefs.length > 0,
  });

  const attestorsByAssertionRef = useMemo(() => {
    const buckets = new Map<string, Map<string, number>>();

    for (const attestation of requestAttestationsQuery.data ?? []) {
      const parsed = parseAttestation(attestation);
      if (!parsed.assertionRef) continue;

      const key = `${parsed.assertionRef.type}:${parsed.assertionRef.value}`;
      const byPubkey = buckets.get(key) ?? new Map<string, number>();
      const previous = byPubkey.get(attestation.pubkey);
      if (!previous || attestation.created_at > previous) {
        byPubkey.set(attestation.pubkey, attestation.created_at);
      }
      buckets.set(key, byPubkey);
    }

    const resolved = new Map<string, string[]>();
    for (const [key, byPubkey] of buckets.entries()) {
      resolved.set(
        key,
        [...byPubkey.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([pubkey]) => pubkey),
      );
    }

    return resolved;
  }, [requestAttestationsQuery.data]);

  const myProficiencyQuery = useQuery({
    queryKey: ['nostr', 'marketplace-my-proficiency', user?.pubkey ?? ''],
    queryFn: async () => {
      if (!user?.pubkey) return undefined;

      const events = await nostr.query([
        {
          kinds: [ATTESTOR_PROFICIENCY_DECLARATION_KIND],
          authors: [user.pubkey],
          limit: 20,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return events.sort((a, b) => b.created_at - a.created_at)[0];
    },
    enabled: !!user?.pubkey,
  });

  const proficiencyKinds = useMemo(() => {
    if (!myProficiencyQuery.data) return new Set<number>();
    return new Set(parseAttestorProficiencyDeclaration(myProficiencyQuery.data).kinds);
  }, [myProficiencyQuery.data]);

  const rankedRequests = useMemo(() => {
    return requests
      .map((request) => {
        const parsed = parseAttestationRequest(request);
        const assertion = parsed.assertionRef
          ? parsed.assertionRef.type === 'e'
            ? assertionData?.byId[parsed.assertionRef.value]
            : parsed.assertionRef.type === 'a'
              ? assertionData?.byAddress[parsed.assertionRef.value]
              : undefined
          : undefined;
        const assertionKind = assertion?.kind;
        const matchesMyProficiency = typeof assertionKind === 'number' && proficiencyKinds.has(assertionKind);

        return {
          request,
          assertion,
          assertionKind,
          matchesMyProficiency,
          existingAttestors: parsed.assertionRef
            ? (attestorsByAssertionRef.get(`${parsed.assertionRef.type}:${parsed.assertionRef.value}`) ?? [])
            : [],
        };
      })
      .sort((a, b) => {
        if (a.matchesMyProficiency !== b.matchesMyProficiency) {
          return a.matchesMyProficiency ? -1 : 1;
        }
        return b.request.created_at - a.request.created_at;
      });
  }, [requests, assertionData, proficiencyKinds, attestorsByAssertionRef]);

  useSeoMeta({
    title: 'Marketplace • Attestr',
    description: 'Attestation request marketplace for attestors.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-2xl">Marketplace</CardTitle>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Request attestation</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create an attestation request</DialogTitle>
                  <DialogDescription>
                    Search for the assertion event you want attested, then publish a request event.
                  </DialogDescription>
                </DialogHeader>

                <AssertionSearchPanel
                  defaultAuthors={user?.pubkey ? [user.pubkey] : []}
                  actionMode="request"
                  onRequestPublished={() => {
                    setIsRequestDialogOpen(false);
                    void requestsQuery.refetch();
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">
              All attestation requests are shown below. Requests matching kinds in your proficiency declaration are highlighted and ranked first.
            </p>

            {myProficiencyQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : user ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-xs font-medium text-slate-700">Your proficiency kinds</span>
                {proficiencyKinds.size > 0 ? (
                  [...proficiencyKinds.values()].map((kind) => (
                    <Badge key={kind} variant="secondary">{formatKind(kind)}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No declaration published yet.</span>
                )}
              </div>
            ) : null}

            {requestsQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-24 w-full" />
                ))}
              </div>
            ) : rankedRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attestation requests found right now.</p>
            ) : (
              <div className="space-y-3">
                {rankedRequests.map(({ request, assertion, assertionKind, matchesMyProficiency, existingAttestors }) => (
                  <MarketplaceRequestCard
                    key={request.id}
                    request={request}
                    assertion={assertion}
                    assertionKind={assertionKind}
                    highlighted={matchesMyProficiency}
                    existingAttestors={existingAttestors}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function MarketplaceRequestCard({
  request,
  assertion,
  assertionKind,
  highlighted,
  existingAttestors,
}: {
  request: NostrEvent;
  assertion?: NostrEvent;
  assertionKind?: number;
  highlighted: boolean;
  existingAttestors: string[];
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const requester = useAuthor(request.pubkey);
  const requesterName = getNostrDisplayName(requester.data?.metadata, request.pubkey);
  const requesterAvatar = requester.data?.metadata?.picture;
  const asserterPubkey = assertion?.pubkey;
  const asserter = useAuthor(asserterPubkey);
  const asserterName = asserterPubkey
    ? getNostrDisplayName(asserter.data?.metadata, asserterPubkey)
    : 'Unknown assertor';
  const asserterAvatar = asserter.data?.metadata?.picture;

  const requestedAttestors = request.tags
    .filter(([name, value]) => name === 'p' && value)
    .map(([, value]) => value)
    .slice(0, 4);

  return (
    <>
      <div
        className={[
          'cursor-pointer rounded-md border p-3 transition hover:border-slate-300 hover:bg-white',
          highlighted
            ? 'border-emerald-300 bg-emerald-50/70'
            : 'border-slate-200 bg-slate-50/70',
        ].join(' ')}
        onClick={() => setIsDetailOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={highlighted ? 'default' : 'outline'}>
              {highlighted ? 'Matches your proficiency' : 'Request'}
            </Badge>
            <Badge variant="secondary">
              {typeof assertionKind === 'number' ? formatKind(assertionKind) : 'Unknown assertion kind'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(request.created_at * 1000).toLocaleString()}
          </span>
        </div>

        <div className="mt-2 rounded-md border border-slate-200 bg-white/90 p-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-6 w-6 border border-slate-200">
              <AvatarImage src={requesterAvatar} alt={requesterName} />
              <AvatarFallback className="text-[9px]">{requesterName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <a
              href={getProfilePath(request.pubkey)}
              onClick={(event) => event.stopPropagation()}
              className="truncate text-xs font-medium text-slate-800 hover:underline"
            >
              {requesterName}
            </a>
            <span className="text-[11px] text-muted-foreground">requested this attestation</span>
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-2">
            <Avatar className="h-6 w-6 border border-slate-200">
              <AvatarImage src={asserterAvatar} alt={asserterName} />
              <AvatarFallback className="text-[9px]">{asserterName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {asserterPubkey ? (
              <a
                href={getProfilePath(asserterPubkey)}
                onClick={(event) => event.stopPropagation()}
                className="truncate text-xs font-medium text-slate-800 hover:underline"
              >
                {asserterName}
              </a>
            ) : (
              <span className="truncate text-xs font-medium text-slate-800">{asserterName}</span>
            )}
            <span className="text-[11px] text-muted-foreground">made the assertion</span>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-slate-700">
          {request.content.trim() || 'No request message.'}
        </p>

        <div className="mt-2 rounded-md border border-slate-200 bg-white/90 p-2">
          <p className="line-clamp-1 text-[11px] text-slate-600">
            {assertion?.content.trim() || 'Assertion content unavailable.'}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Existing attestors</span>
          {existingAttestors.length > 0 ? (
            <>
              <span className="text-xs font-medium text-slate-700">{existingAttestors.length}</span>
              <div className="flex items-center gap-1">
                {existingAttestors.slice(0, 6).map((attestor) => (
                  <ExistingAttestorAvatar key={attestor} pubkey={attestor} onCardClickStop />
                ))}
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">None yet</span>
          )}
        </div>

        {requestedAttestors.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Requested attestors</span>
            {requestedAttestors.map((attestor) => (
              <RequestedAttestorPill
                key={attestor}
                pubkey={attestor}
                onCardClickStop
              />
            ))}
          </div>
        ) : null}
      </div>

      <AttestationRequestDetailDialog
        request={request}
        assertion={assertion}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}

function RequestedAttestorPill({ pubkey, onCardClickStop = false }: { pubkey: string; onCardClickStop?: boolean }) {
  const author = useAuthor(pubkey);
  const displayName = getNostrDisplayName(author.data?.metadata, pubkey);
  const avatar = author.data?.metadata?.picture;

  return (
    <a
      href={getProfilePath(pubkey)}
      onClick={(event) => {
        if (onCardClickStop) event.stopPropagation();
      }}
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

function ExistingAttestorAvatar({ pubkey, onCardClickStop = false }: { pubkey: string; onCardClickStop?: boolean }) {
  const author = useAuthor(pubkey);
  const displayName = getNostrDisplayName(author.data?.metadata, pubkey);
  const avatar = author.data?.metadata?.picture;

  return (
    <a
      href={getProfilePath(pubkey)}
      onClick={(event) => {
        if (onCardClickStop) event.stopPropagation();
      }}
      title={displayName}
      className="inline-flex"
    >
      <Avatar className="h-5 w-5 border border-slate-200">
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="text-[8px]">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    </a>
  );
}

function groupLatestByPubkeyAndD(events: NostrEvent[]): NostrEvent[] {
  const byKey = new Map<string, NostrEvent>();

  for (const event of events) {
    const d = event.tags.find(([name]) => name === 'd')?.[1] ?? event.id;
    const key = `${event.pubkey}:${d}`;
    const previous = byKey.get(key);
    if (!previous || event.created_at > previous.created_at) {
      byKey.set(key, event);
    }
  }

  return [...byKey.values()];
}
