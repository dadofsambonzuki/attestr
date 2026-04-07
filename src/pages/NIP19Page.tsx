import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import { Navigate, useParams } from 'react-router-dom';

import { AppHeader } from '@/components/AppHeader';
import { AssertionDetailContent } from '@/components/attestr/AssertionDetailContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfilePath } from '@/lib/nostrEncodings';
import NotFound from './NotFound';

type ResolvedNip19 =
  | { type: 'profile'; pubkey: string }
  | { type: 'event'; id: string }
  | { type: 'address'; kind: number; pubkey: string; identifier: string };

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();
  const { nostr } = useNostr();

  useSeoMeta({
    title: 'Attestr',
  });

  const decoded = decodeIdentifier(identifier);
  const canResolveEvent = decoded?.type === 'event' || decoded?.type === 'address';

  const eventQuery = useQuery({
    queryKey: ['nostr', 'nip19-event', identifier ?? ''],
    enabled: canResolveEvent,
    queryFn: async () => {
      if (!decoded || (decoded.type !== 'event' && decoded.type !== 'address')) return null;

      if (decoded.type === 'event') {
        const [event] = await nostr.query([{ ids: [decoded.id], limit: 1 }], {
          signal: AbortSignal.timeout(6000),
        });
        return event ?? null;
      }

      const [event] = await nostr.query([
        {
          kinds: [decoded.kind],
          authors: [decoded.pubkey],
          '#d': [decoded.identifier],
          limit: 1,
        },
      ], {
        signal: AbortSignal.timeout(6000),
      });

      return event ?? null;
    },
  });

  if (!decoded) {
    return <NotFound />;
  }

  if (decoded.type === 'profile') {
    return <Navigate to={getProfilePath(decoded.pubkey)} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {eventQuery.isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        ) : !eventQuery.data ? (
          <NotFound />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Event</CardTitle>
            </CardHeader>
            <CardContent>
              <AssertionDetailContent assertion={eventQuery.data} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function decodeIdentifier(identifier: string | undefined): ResolvedNip19 | null {
  if (!identifier) return null;

  try {
    const decoded = nip19.decode(identifier);

    switch (decoded.type) {
      case 'npub':
        return { type: 'profile', pubkey: decoded.data };
      case 'nprofile':
        return { type: 'profile', pubkey: decoded.data.pubkey };
      case 'note':
        return { type: 'event', id: decoded.data };
      case 'nevent':
        return { type: 'event', id: decoded.data.id };
      case 'naddr':
        return {
          type: 'address',
          kind: decoded.data.kind,
          pubkey: decoded.data.pubkey,
          identifier: decoded.data.identifier,
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
