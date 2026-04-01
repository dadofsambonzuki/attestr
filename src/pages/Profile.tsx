import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AppHeader } from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { AttestationStatusBadge } from '@/components/attestr/AttestationStatusBadge';
import {
  ATTESTATION_KIND,
  ATTESTATION_REQUEST_KIND,
  ATTESTOR_PROFICIENCY_DECLARATION_KIND,
  ATTESTOR_RECOMMENDATION_KIND,
  parseAddressCoordinate,
  parseAttestation,
  parseAttestationRequest,
  parseAttestorProficiencyDeclaration,
  parseAttestorRecommendation,
} from '@/lib/attestation';
import { formatKind, getKindName } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { encodeEventPointer, encodeNpub, getProfilePath } from '@/lib/nostrEncodings';
import { normalizeToPubkey } from '@/lib/nostrIdentity';
import { AttestorRecommendationDialog } from '@/components/attestr/AttestorRecommendationDialog';
import { ProficiencyDeclarationDialog } from '@/components/attestr/ProficiencyDeclarationDialog';
import { AssertionDetailDialog } from '@/components/attestr/AssertionDetailDialog';
import { AttestationRequestDetailDialog } from '@/components/attestr/AttestationRequestDetailDialog';
import { AttestorRecommendationDetailDialog } from '@/components/attestr/AttestorRecommendationDetailDialog';
import type { NostrEvent } from '@nostrify/nostrify';

interface ClientProfileLink {
  label: string;
  href: (npub: string) => string;
}

const CLIENT_PROFILE_LINKS: ClientProfileLink[] = [
  { label: 'Jumble', href: (npub) => `https://jumble.social/${npub}` },
  { label: 'Nostria', href: (npub) => `https://www.nostria.app/${npub}` },
  { label: 'njump', href: (npub) => `https://njump.me/${npub}` },
  { label: 'Primal', href: (npub) => `https://primal.net/p/${npub}` },
  { label: 'Snort', href: (npub) => `https://snort.social/p/${npub}` },
];

export default function Profile() {
  const { identifier } = useParams<{ identifier: string }>();
  const pubkey = identifier ? normalizeToPubkey(identifier) : null;
  const npub = pubkey ? encodeNpub(pubkey) : null;
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [recommendDialogOpen, setRecommendDialogOpen] = useState(false);
  const [proficiencyDialogOpen, setProficiencyDialogOpen] = useState(false);

  const author = useAuthor(pubkey ?? undefined);
  const isOwnProfile = Boolean(user?.pubkey && pubkey && user.pubkey === pubkey);

  const attestationsQuery = useQuery({
    queryKey: ['nostr', 'profile-attestations', pubkey ?? ''],
    queryFn: async () => {
      if (!pubkey) return [];

      return nostr.query([
        {
          kinds: [ATTESTATION_KIND],
          authors: [pubkey],
          limit: 50,
        },
      ], { signal: AbortSignal.timeout(6000) });
    },
    enabled: !!pubkey,
  });

  const requestsFromQuery = useQuery({
    queryKey: ['nostr', 'profile-attestation-requests-from', pubkey ?? ''],
    queryFn: async () => {
      if (!pubkey) return [];

      const events = await nostr.query([
        {
          kinds: [ATTESTATION_REQUEST_KIND],
          authors: [pubkey],
          limit: 100,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return groupLatestByPubkeyAndD(events).sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
  });

  const requestsToQuery = useQuery({
    queryKey: ['nostr', 'profile-attestation-requests-to', pubkey ?? ''],
    queryFn: async () => {
      if (!pubkey) return [];

      const events = await nostr.query([
        {
          kinds: [ATTESTATION_REQUEST_KIND],
          '#p': [pubkey],
          limit: 100,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return groupLatestByPubkeyAndD(events).sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
  });

  const recommendationsToQuery = useQuery({
    queryKey: ['nostr', 'profile-attestor-recommendations-to', pubkey ?? ''],
    queryFn: async () => {
      if (!pubkey) return [];

      const events = await nostr.query([
        {
          kinds: [ATTESTOR_RECOMMENDATION_KIND],
          '#p': [pubkey],
          limit: 100,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return groupLatestByPubkeyAndD(events).sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
  });

  const recommendationsFromQuery = useQuery({
    queryKey: ['nostr', 'profile-attestor-recommendations-from', pubkey ?? ''],
    queryFn: async () => {
      if (!pubkey) return [];

      const events = await nostr.query([
        {
          kinds: [ATTESTOR_RECOMMENDATION_KIND],
          authors: [pubkey],
          limit: 100,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return groupLatestByPubkeyAndD(events).sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
  });

  const proficiencyQuery = useQuery({
    queryKey: ['nostr', 'profile-proficiency-declaration', pubkey ?? ''],
    queryFn: async () => {
      if (!pubkey) return undefined;

      const events = await nostr.query([
        {
          kinds: [ATTESTOR_PROFICIENCY_DECLARATION_KIND],
          authors: [pubkey],
          limit: 20,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return events.sort((a, b) => b.created_at - a.created_at)[0];
    },
    enabled: !!pubkey,
  });

  const receivedAttestationsQuery = useQuery({
    queryKey: ['nostr', 'profile-received-attestations', pubkey ?? ''],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [ATTESTATION_KIND],
          limit: 300,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
  });

  const attestations = useMemo(() => attestationsQuery.data ?? [], [attestationsQuery.data]);
  const requestsFrom = useMemo(() => requestsFromQuery.data ?? [], [requestsFromQuery.data]);
  const requestsTo = useMemo(() => requestsToQuery.data ?? [], [requestsToQuery.data]);
  const recommendationsTo = useMemo(() => recommendationsToQuery.data ?? [], [recommendationsToQuery.data]);
  const recommendationsFrom = useMemo(() => recommendationsFromQuery.data ?? [], [recommendationsFromQuery.data]);
  const proficiency = proficiencyQuery.data;
  const receivedAttestations = useMemo(() => receivedAttestationsQuery.data ?? [], [receivedAttestationsQuery.data]);

  const { data: assertionData } = useAssertionEvents(attestations);
  const { data: requestAssertionData } = useAssertionEvents([...requestsFrom, ...requestsTo]);
  const { data: receivedAssertionData } = useAssertionEvents(receivedAttestations);

  const proficiencyKinds = useMemo(
    () => (proficiency ? parseAttestorProficiencyDeclaration(proficiency).kinds : []),
    [proficiency],
  );

  const recommendedKindGroups = useMemo(() => {
    const groups = new Map<number, Set<string>>();

    for (const recommendation of recommendationsTo) {
      if (recommendation.pubkey === pubkey) continue;

      const parsed = parseAttestorRecommendation(recommendation);
      for (const kind of parsed.kinds) {
        const existing = groups.get(kind) ?? new Set<string>();
        existing.add(recommendation.pubkey);
        groups.set(kind, existing);
      }
    }

    return [...groups.entries()]
      .map(([kind, recommenders]) => ({ kind, recommenders: [...recommenders] }))
      .sort((a, b) => b.recommenders.length - a.recommenders.length || a.kind - b.kind);
  }, [recommendationsTo, pubkey]);

  const receivedAssertionGroups = useMemo(() => {
    const grouped = new Map<string, {
      assertion?: NostrEvent;
      assertionKind?: number;
      assertionRef: string;
      attestations: NostrEvent[];
    }>();

    for (const attestation of receivedAttestations) {
      const parsed = parseAttestation(attestation);
      if (!parsed.assertionRef) continue;

      const assertion = parsed.assertionRef.type === 'e'
        ? receivedAssertionData?.byId[parsed.assertionRef.value]
        : parsed.assertionRef.type === 'a'
          ? receivedAssertionData?.byAddress[parsed.assertionRef.value]
          : undefined;

      const coordinate = parsed.assertionRef.type === 'a'
        ? parseAddressCoordinate(parsed.assertionRef.value)
        : null;
      const isAuthoredAssertion = Boolean(
        (assertion && assertion.pubkey === pubkey)
        || (coordinate && coordinate.pubkey === pubkey),
      );
      if (!isAuthoredAssertion) continue;

      const inferredKind = assertion?.kind ?? coordinate?.kind;

      const key = `${parsed.assertionRef.type}:${parsed.assertionRef.value}`;
      const bucket = grouped.get(key);
      if (!bucket) {
        grouped.set(key, {
          assertion,
          assertionKind: inferredKind,
          assertionRef: parsed.assertionRef.value,
          attestations: [attestation],
        });
      } else {
        if (!bucket.assertion && assertion) {
          bucket.assertion = assertion;
        }
        if (typeof bucket.assertionKind !== 'number' && typeof inferredKind === 'number') {
          bucket.assertionKind = inferredKind;
        }
        bucket.attestations.push(attestation);
      }
    }

    return [...grouped.values()]
      .map((group) => {
        const uniqueAttestors = [...new Set(group.attestations.map((event) => event.pubkey))];
        const latestAttestationAt = Math.max(...group.attestations.map((event) => event.created_at));
        return {
          groupKey: `${group.assertionRef}:${latestAttestationAt}`,
          ...group,
          uniqueAttestors,
          latestAttestationAt,
        };
      })
      .sort((a, b) => b.latestAttestationAt - a.latestAttestationAt);
  }, [receivedAttestations, receivedAssertionData, pubkey]);

  useSeoMeta({
    title: pubkey ? 'Profile • Attestr' : 'Profile not found • Attestr',
    description: 'Profile metadata and attestations by this user.',
  });

  if (!pubkey || !npub) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Invalid profile identifier.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const metadata = author.data?.metadata;
  const displayName = getNostrDisplayName(metadata, pubkey);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="h-14 w-14 border border-slate-200">
                <AvatarImage src={metadata?.picture} alt={displayName} />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-slate-900">{displayName}</h1>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{npub}</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{pubkey}</p>
              </div>
            </div>

            {metadata?.about ? <p className="text-sm text-slate-700">{metadata.about}</p> : null}

            <div className="flex flex-wrap gap-2">
              {CLIENT_PROFILE_LINKS.map((client) => (
                <a
                  key={client.label}
                  href={client.href(npub)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  View on {client.label}
                </a>
              ))}


            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Attestor Proficiency Declaration</CardTitle>
            {isOwnProfile ? (
              <ProficiencyDeclarationDialog
                existing={proficiency}
                open={proficiencyDialogOpen}
                onOpenChange={setProficiencyDialogOpen}
                onPublished={() => proficiencyQuery.refetch()}
              >
                <Button size="sm" variant="outline">
                  {proficiency ? 'Edit declaration' : 'Add declaration'}
                </Button>
              </ProficiencyDeclarationDialog>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {proficiencyQuery.isLoading ? (
              <Skeleton className="h-14 w-full" />
            ) : proficiency ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {proficiencyKinds.map((kind) => (
                    <Badge key={kind} variant="secondary">
                      {formatKind(kind)}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(proficiency.created_at * 1000).toLocaleString()}
                </p>

                {recommendedKindGroups.length > 0 ? (
                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-xs font-medium text-slate-700">Recommended by others</p>
                    <div className="flex flex-col gap-2">
                      {recommendedKindGroups.map(({ kind, recommenders }) => (
                        <RecommendedKindCard key={kind} kind={kind} recommenderPubkeys={recommenders} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No proficiency declaration published for this profile yet.
              </p>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Attestations by this user</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attestationsQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((row) => (
                    <Skeleton key={row} className="h-14 w-full" />
                  ))}
                </div>
              ) : attestations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attestations found for this profile yet.</p>
              ) : (
                attestations.map((attestation) => {
                  const parsed = parseAttestation(attestation);
                  const pointer = encodeEventPointer(attestation);
                  const assertion = parsed.assertionRef
                    ? parsed.assertionRef.type === 'e'
                      ? assertionData?.byId[parsed.assertionRef.value]
                      : parsed.assertionRef.type === 'a'
                        ? assertionData?.byAddress[parsed.assertionRef.value]
                        : undefined
                    : undefined;

                  return (
                    <ProfileAttestationCard
                      key={attestation.id}
                      attestation={attestation}
                      assertion={assertion}
                      to={`/attestations/${pointer}`}
                    />
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Received attestations on authored assertions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {receivedAttestationsQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((row) => (
                    <Skeleton key={row} className="h-16 w-full" />
                  ))}
                </div>
              ) : receivedAssertionGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No received attestations found for authored assertions yet.</p>
              ) : (
                receivedAssertionGroups.map((group) => (
                  <ReceivedAssertionSummaryCard
                    key={group.groupKey}
                    assertion={group.assertion}
                    assertionKind={group.assertionKind}
                    attestationCount={group.attestations.length}
                    attestorPubkeys={group.uniqueAttestors}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Requests from this attestor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requestsFromQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((row) => (
                    <Skeleton key={row} className="h-14 w-full" />
                  ))}
                </div>
              ) : requestsFrom.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outgoing attestation requests yet.</p>
              ) : (
                requestsFrom.map((request) => {
                  const parsed = parseAttestationRequest(request);
                  const assertion = parsed.assertionRef
                    ? parsed.assertionRef.type === 'e'
                      ? requestAssertionData?.byId[parsed.assertionRef.value]
                      : parsed.assertionRef.type === 'a'
                        ? requestAssertionData?.byAddress[parsed.assertionRef.value]
                        : undefined
                    : undefined;

                  return (
                    <ProfileRequestCard key={request.id} request={request} assertion={assertion} />
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Requests to this attestor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requestsToQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((row) => (
                    <Skeleton key={row} className="h-14 w-full" />
                  ))}
                </div>
              ) : requestsTo.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incoming attestation requests yet.</p>
              ) : (
                requestsTo.map((request) => {
                  const parsed = parseAttestationRequest(request);
                  const assertion = parsed.assertionRef
                    ? parsed.assertionRef.type === 'e'
                      ? requestAssertionData?.byId[parsed.assertionRef.value]
                      : parsed.assertionRef.type === 'a'
                        ? requestAssertionData?.byAddress[parsed.assertionRef.value]
                        : undefined
                    : undefined;

                  return (
                    <ProfileRequestCard key={request.id} request={request} assertion={assertion} />
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Recommendations from this attestor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendationsFromQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((row) => (
                    <Skeleton key={row} className="h-14 w-full" />
                  ))}
                </div>
              ) : recommendationsFrom.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outgoing recommendations yet.</p>
              ) : (
                recommendationsFrom.map((recommendation) => (
                  <ProfileRecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    perspective="from"
                    onUpdated={() => {
                      void recommendationsFromQuery.refetch();
                      void recommendationsToQuery.refetch();
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>Recommendations for this attestor</CardTitle>
              {!isOwnProfile && user ? (
                <AttestorRecommendationDialog
                  recommendedAttestorPubkey={pubkey}
                  open={recommendDialogOpen}
                  onOpenChange={setRecommendDialogOpen}
                  onPublished={() => {
                    void recommendationsToQuery.refetch();
                  }}
                >
                  <Button variant="outline" size="sm">
                    Recommend this attestor
                  </Button>
                </AttestorRecommendationDialog>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendationsToQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((row) => (
                    <Skeleton key={row} className="h-14 w-full" />
                  ))}
                </div>
              ) : recommendationsTo.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recommendations for this attestor yet.</p>
              ) : (
                recommendationsTo.map((recommendation) => (
                  <ProfileRecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    perspective="to"
                    onUpdated={() => {
                      void recommendationsFromQuery.refetch();
                      void recommendationsToQuery.refetch();
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function ProfileAttestationCard({
  attestation,
  assertion,
  to,
}: {
  attestation: NostrEvent;
  assertion?: NostrEvent;
  to: string;
}) {
  const parsed = parseAttestation(attestation);
  const asserter = useAuthor(assertion?.pubkey ?? undefined);
  const asserterName = assertion
    ? getNostrDisplayName(asserter.data?.metadata, assertion.pubkey)
    : 'Unknown author';
  const asserterAvatar = assertion ? asserter.data?.metadata?.picture : undefined;
  const assertionKind = assertion ? (getKindName(assertion.kind) ?? 'Unkown') : 'Event reference';

  return (
    <Link
      to={to}
      className="block rounded-md border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-white"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {new Date(attestation.created_at * 1000).toLocaleString()}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-700">
        {attestation.content.trim() || 'No attestation message.'}
      </p>

      <div className="mt-2 rounded-md border border-slate-200 bg-white/90 p-2">
        <div className="mb-2">
          <AttestationStatusBadge status={parsed.status} />
        </div>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-5 w-5 border border-slate-200">
              <AvatarImage src={asserterAvatar} alt={asserterName} />
              <AvatarFallback className="text-[9px]">{asserterName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="truncate text-[11px] font-medium text-slate-700">{asserterName}</p>
          </div>
          <Badge variant="outline" className="max-w-[48%] truncate text-[10px] font-medium">
            {assertionKind}
          </Badge>
        </div>
        <p className="mt-1 line-clamp-1 text-[11px] text-slate-600">
          {assertion?.content.trim() || 'Assertion content unavailable.'}
        </p>
      </div>
    </Link>
  );
}

function ProfileRequestCard({ request, assertion }: { request: NostrEvent; assertion?: NostrEvent }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const requestedAttestors = request.tags
    .filter(([name, value]) => name === 'p' && value)
    .map(([, value]) => value)
    .slice(0, 3);
  const assertionKind = assertion ? formatKind(assertion.kind) : 'Unknown assertion kind';

  return (
    <>
      <div
        className="cursor-pointer rounded-md border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-white"
        onClick={() => setIsDetailOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">Request</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(request.created_at * 1000).toLocaleString()}
          </span>
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
          <Badge variant="secondary">{assertionKind}</Badge>
          {requestedAttestors.map((attestor) => (
            <a
              key={attestor}
              href={getProfilePath(attestor)}
              onClick={(event) => event.stopPropagation()}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50"
            >
              {encodeNpub(attestor)}
            </a>
          ))}
        </div>
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

function ProfileRecommendationCard({
  recommendation,
  perspective,
  onUpdated,
}: {
  recommendation: NostrEvent;
  perspective: 'from' | 'to';
  onUpdated?: () => void;
}) {
  const parsed = parseAttestorRecommendation(recommendation);
  const subjectPubkey = perspective === 'from'
    ? parsed.recommendedAttestor
    : recommendation.pubkey;
  const subjectAuthor = useAuthor(subjectPubkey);
  const subjectName = subjectPubkey
    ? getNostrDisplayName(subjectAuthor.data?.metadata, subjectPubkey)
    : 'Unknown attestor';
  const subjectAvatar = subjectAuthor.data?.metadata?.picture;
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <div
        className="cursor-pointer rounded-md border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-white"
        onClick={() => setIsDetailOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-6 w-6 border border-slate-200">
              <AvatarImage src={subjectAvatar} alt={subjectName} />
              <AvatarFallback className="text-[9px]">{subjectName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {subjectPubkey ? (
              <a href={getProfilePath(subjectPubkey)} className="truncate text-xs font-medium text-slate-800 hover:underline">
                {subjectName}
              </a>
            ) : (
              <span className="truncate text-xs font-medium text-slate-800">{subjectName}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(recommendation.created_at * 1000).toLocaleString()}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {parsed.kinds.length > 0 ? (
            parsed.kinds.map((kind) => (
              <Badge key={kind} variant="secondary">{formatKind(kind)}</Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No kind tags.</p>
          )}
        </div>
      </div>

      <AttestorRecommendationDetailDialog
        recommendation={recommendation}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdated={onUpdated}
      />
    </>
  );
}

function ReceivedAssertionSummaryCard({
  assertion,
  assertionKind,
  attestationCount,
  attestorPubkeys,
}: {
  assertion?: NostrEvent;
  assertionKind?: number;
  attestationCount: number;
  attestorPubkeys: string[];
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const canOpenDetails = Boolean(assertion);

  return (
    <>
      <div
        className={[
          'rounded-md border border-slate-200 bg-slate-50/70 p-3 transition',
          canOpenDetails ? 'cursor-pointer hover:border-slate-300 hover:bg-white' : '',
        ].join(' ')}
        onClick={() => {
          if (canOpenDetails) setIsDetailOpen(true);
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">
            {typeof assertion?.kind === 'number'
              ? formatKind(assertion.kind)
              : typeof assertionKind === 'number'
                ? formatKind(assertionKind)
                : 'Event reference'}
          </Badge>
          <span className="text-xs text-muted-foreground">{attestationCount} attestations</span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-slate-700">
          {assertion?.content.trim() || 'Assertion content unavailable on currently connected relays.'}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Attested by</span>
          <div className="flex items-center">
            {attestorPubkeys.slice(0, 6).map((pubkey, idx) => (
              <ReceivedAttestorAvatar key={pubkey} pubkey={pubkey} overlapIndex={idx} />
            ))}
            {attestorPubkeys.length > 6 ? (
              <span className="ml-2 text-xs text-muted-foreground">+{attestorPubkeys.length - 6}</span>
            ) : null}
          </div>
        </div>
      </div>

      {assertion ? (
        <AssertionDetailDialog
          assertion={assertion}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      ) : null}
    </>
  );
}

function ReceivedAttestorAvatar({ pubkey, overlapIndex }: { pubkey: string; overlapIndex: number }) {
  const author = useAuthor(pubkey);
  const name = getNostrDisplayName(author.data?.metadata, pubkey);
  const avatar = author.data?.metadata?.picture;

  return (
    <Avatar
      className="h-6 w-6 border border-white"
      style={{ marginLeft: overlapIndex === 0 ? 0 : -8 }}
    >
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback className="text-[9px]">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function RecommendedKindCard({ kind, recommenderPubkeys }: { kind: number; recommenderPubkeys: string[] }) {
  const MAX_AVATARS = 6;
  const overflow = recommenderPubkeys.length - MAX_AVATARS;

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
      <Badge variant="outline" className="shrink-0">{formatKind(kind)}</Badge>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center">
          {recommenderPubkeys.slice(0, MAX_AVATARS).map((pubkey, idx) => (
            <RecommenderAvatar key={pubkey} pubkey={pubkey} overlapIndex={idx} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {overflow > 0 ? `+${overflow} ` : ''}{recommenderPubkeys.length === 1 ? '1 recommender' : `${recommenderPubkeys.length} recommenders`}
        </span>
      </div>
    </div>
  );
}

function RecommenderAvatar({ pubkey, overlapIndex }: { pubkey: string; overlapIndex: number }) {
  const author = useAuthor(pubkey);
  const name = getNostrDisplayName(author.data?.metadata, pubkey);
  const avatar = author.data?.metadata?.picture;

  return (
    <Avatar
      className="h-5 w-5 border border-white"
      style={{ marginLeft: overlapIndex === 0 ? 0 : -6 }}
    >
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback className="text-[8px]">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
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
