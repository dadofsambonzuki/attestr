import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Search, ShieldCheck } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { useAttestationFeed } from '@/hooks/useAttestationFeed';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { parseAttestation, parseAddressCoordinate } from '@/lib/attestation';
import { getKindName } from '@/lib/nostrKinds';
import { encodeEventPointer } from '@/lib/nostrEncodings';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import type { NostrEvent } from '@nostrify/nostrify';


const Index = () => {
  useSeoMeta({
    title: 'Attestr',
    description: 'Search assertions, publish attestations, and inspect trust signals with comments and zaps.',
  });

  const { data: recentAttestations = [], isLoading } = useAttestationFeed({
    query: '',
    attestors: [],
    statuses: [],
    assertionKinds: [],
    days: 30,
  }, 0, 3);
  const { data: assertionData } = useAssertionEvents(recentAttestations);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,rgba(14,165,233,0.20),transparent_40%),radial-gradient(circle_at_78%_10%,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_60%_85%,rgba(14,116,144,0.12),transparent_35%)]" />

          <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
            <div className="space-y-6 lg:col-span-3">
              <img
                src="/images/attestr-logo-side.png"
                alt="Attestr logo"
                className="h-[72px] w-auto sm:h-[84px]"
              />

              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Notaries on Nostr
              </h1>

              <p className="max-w-2xl text-xl font-medium text-slate-700 sm:text-2xl">
                Enabling claims to be verified and transparently signalled to others via <em>attestations</em>.
              </p>

              <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
                Every event published on Nostr is an assertion by the creator - not inherently true or false. Attestations are verifications from others who evaluate the validity of those assertions.
              </p>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
                <em>Attestr</em> helps both sides connect and lets observers inspect trust signals.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <ExplainerCard
                  icon={Search}
                  title="Search Assertions"
                  text="Find regular Nostr events you would like to attest to."
                  href="/attest"
                />
                <ExplainerCard
                  icon={BadgeCheck}
                  title="View Attestations"
                  text="Surface attestations others have already made."
                  href="/attestations"
                />
                <ExplainerCard
                  icon={ShieldCheck}
                  title="Marketplace"
                  text="Find specialist attestors, request attestations & provide recommendations."
                  href="/marketplace"
                />
              </div>
            </div>

            <Card className="border-slate-200 bg-white/90 shadow-lg lg:col-span-2">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent attestations</p>
                  <Link to="/attestations" className="text-xs font-medium text-slate-600 hover:text-slate-900">View all</Link>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-36 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="mt-2 h-3 w-48" />
                      </div>
                    ))}
                  </div>
                ) : recentAttestations.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                    No recent attestations yet. Be the first to publish one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentAttestations.map((event) => {
                      const parsed = parseAttestation(event);
                      const assertionEvent = parsed.assertionRef
                        ? parsed.assertionRef.type === 'e'
                          ? assertionData?.byId[parsed.assertionRef.value]
                          : parsed.assertionRef.type === 'a'
                            ? assertionData?.byAddress[parsed.assertionRef.value]
                            : undefined
                        : undefined;

                      return <RecentAttestationCard key={event.id} event={event} assertionEvent={assertionEvent} />;
                    })}
                  </div>
                )}

                <Button asChild className="w-full gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  <Link to="/attest">
                    Start Attesting
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

function ExplainerCard({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: typeof Search;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link to={href} className="block h-full">
      <Card className="h-full border-slate-200 bg-white/75 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white">
        <CardContent className="space-y-2 p-4">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-sm leading-relaxed text-slate-600">{text}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentAttestationCard({ event, assertionEvent }: { event: NostrEvent; assertionEvent?: NostrEvent }) {
  const parsed = parseAttestation(event);
  const pointer = encodeEventPointer(event);
  const author = useAuthor(event.pubkey);
  const asserter = useAuthor(assertionEvent?.pubkey ?? '');
  const assertionKind = assertionEvent?.kind ?? (parsed.assertionRef?.type === 'a'
    ? parseAddressCoordinate(parsed.assertionRef.value)?.kind
    : undefined);
  const content = event.content.trim();
  const displayName = getNostrDisplayName(author.data?.metadata, event.pubkey);
  const avatarUrl = author.data?.metadata?.picture;
  const asserterName = assertionEvent
    ? getNostrDisplayName(asserter.data?.metadata, assertionEvent.pubkey)
    : 'Unknown author';
  const asserterAvatarUrl = assertionEvent ? asserter.data?.metadata?.picture : undefined;
  const assertionContent = assertionEvent?.content.trim() ?? '';

  return (
    <Link
      to={`/attestations/${pointer}`}
      className="block h-36 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-white"
    >
      <div className="flex h-full flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7 border border-slate-200">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-[10px]">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="truncate text-xs font-medium text-slate-800">{displayName}</p>
          </div>
          <Badge variant="secondary" className="capitalize">{parsed.status ?? 'unknown'}</Badge>
        </div>

        <div className="space-y-1">
          <p className="line-clamp-2 text-xs text-slate-700">
            {content || 'No attestation message.'}
          </p>

          <div className="rounded-md border border-slate-200 bg-white/90 p-2">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-5 w-5 border border-slate-200">
                  <AvatarImage src={asserterAvatarUrl} alt={asserterName} />
                  <AvatarFallback className="text-[9px]">{asserterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="truncate text-[11px] font-medium text-slate-700">
                  {asserterName}
                </p>
              </div>
              <Badge variant="outline" className="max-w-[48%] truncate text-[10px] font-medium">
                {assertionKind ? (getKindName(assertionKind) ?? 'Unkown') : 'Event reference'}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] text-slate-600">
              {assertionContent || 'Assertion content unavailable.'}
            </p>
          </div>
        </div>

      </div>
    </Link>
  );
}

export default Index;
