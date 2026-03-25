import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { AppHeader } from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { parseAttestation, ATTESTATION_KIND } from '@/lib/attestation';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { encodeEventPointer, encodeNpub } from '@/lib/nostrEncodings';
import { normalizeToPubkey } from '@/lib/nostrIdentity';

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

  const author = useAuthor(pubkey ?? undefined);

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

  const attestations = attestationsQuery.data ?? [];
  const { data: assertionData } = useAssertionEvents(attestations);

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
                  <Link
                    key={attestation.id}
                    to={`/attestations/${pointer}`}
                    className="block rounded-md border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="capitalize">{parsed.status ?? 'unknown'}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(attestation.created_at * 1000).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                      {attestation.content.trim() || 'No attestation message.'}
                    </p>
                    {assertion ? (
                      <p className="mt-1 text-xs text-muted-foreground">Linked assertion available</p>
                    ) : null}
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
