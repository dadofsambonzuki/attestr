import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { AppHeader } from '@/components/AppHeader';
import { AssertionSearchPanel } from '@/components/attestr/AssertionSearchPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  ATTESTATION_REQUEST_KIND,
  ATTESTOR_PROFICIENCY_DECLARATION_KIND,
  parseAttestationRequest,
  parseAttestorProficiencyDeclaration,
} from '@/lib/attestation';
import { formatKind } from '@/lib/nostrKinds';
import type { NostrEvent } from '@nostrify/nostrify';

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
        };
      })
      .sort((a, b) => {
        if (a.matchesMyProficiency !== b.matchesMyProficiency) {
          return a.matchesMyProficiency ? -1 : 1;
        }
        return b.request.created_at - a.request.created_at;
      });
  }, [requests, assertionData, proficiencyKinds]);

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
                {rankedRequests.map(({ request, assertion, assertionKind, matchesMyProficiency }) => (
                  <MarketplaceRequestCard
                    key={request.id}
                    request={request}
                    assertion={assertion}
                    assertionKind={assertionKind}
                    highlighted={matchesMyProficiency}
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
}: {
  request: NostrEvent;
  assertion?: NostrEvent;
  assertionKind?: number;
  highlighted: boolean;
}) {
  const requestedAttestors = request.tags
    .filter(([name, value]) => name === 'p' && value)
    .map(([, value]) => value)
    .slice(0, 4);

  return (
    <div
      className={[
        'rounded-md border p-3',
        highlighted
          ? 'border-emerald-300 bg-emerald-50/70'
          : 'border-slate-200 bg-slate-50/70',
      ].join(' ')}
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

      <p className="mt-2 line-clamp-2 text-sm text-slate-700">
        {request.content.trim() || 'No request message.'}
      </p>

      <p className="mt-2 line-clamp-2 text-xs text-slate-600">
        {assertion?.content.trim() || 'Assertion content unavailable.'}
      </p>

      {requestedAttestors.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Requested attestors</span>
          {requestedAttestors.map((attestor) => (
            <Badge key={attestor} variant="outline" className="max-w-[240px] truncate">
              {attestor}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
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
