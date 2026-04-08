import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';

import NotFound from './NotFound';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AttestationDetailContent } from '@/components/attestr/AttestationDetailContent';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { parseAttestation, parseAddressCoordinate, ATTESTATION_KIND } from '@/lib/attestation';

export default function AttestationEventPage() {
  const { id } = useParams<{ id: string }>();
  const { nostr } = useNostr();

  useSeoMeta({
    title: 'Attestr',
    description: 'View an attestation event with lifecycle details and discussion.',
  });

  const query = useQuery({
    queryKey: ['nostr', 'attestation-event', id ?? ''],
    queryFn: async () => {
      if (!id) return null;

      const decoded = decodeAttestationIdentifier(id);
      if (!decoded) return null;

      if (decoded.type === 'id') {
        const [event] = await nostr.query([{ ids: [decoded.id], kinds: [ATTESTATION_KIND], limit: 1 }], {
          signal: AbortSignal.timeout(6000),
        });
        return event ?? null;
      }

      const [event] = await nostr.query([
        {
          kinds: [ATTESTATION_KIND],
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

  const attestation = query.data ?? undefined;
  const { data: assertionData } = useAssertionEvents(attestation ? [attestation] : []);
  const parsed = attestation ? parseAttestation(attestation) : undefined;
  const assertion = parsed?.assertionRef
    ? parsed.assertionRef.type === 'e'
      ? assertionData?.byId[parsed.assertionRef.value]
      : parsed.assertionRef.type === 'a'
        ? assertionData?.byAddress[parsed.assertionRef.value]
        : undefined
    : undefined;

  if (!id) return <NotFound />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {query.isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading attestation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        ) : !attestation ? (
          <NotFound />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Attestation Event</CardTitle>
            </CardHeader>
            <CardContent>
              <AttestationDetailContent attestation={attestation} assertion={assertion} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function decodeAttestationIdentifier(value: string):
  | { type: 'id'; id: string }
  | { type: 'address'; pubkey: string; identifier: string }
  | null {
  if (/^[a-f0-9]{64}$/i.test(value)) {
    return { type: 'id', id: value.toLowerCase() };
  }

  try {
    const decoded = nip19.decode(value);
    if (decoded.type === 'nevent') {
      return { type: 'id', id: decoded.data.id };
    }

    if (decoded.type === 'note') {
      return { type: 'id', id: decoded.data };
    }

    if (decoded.type === 'naddr' && decoded.data.kind === ATTESTATION_KIND) {
      return {
        type: 'address',
        pubkey: decoded.data.pubkey,
        identifier: decoded.data.identifier,
      };
    }
  } catch {
    const coord = parseAddressCoordinate(value);
    if (coord && coord.kind === ATTESTATION_KIND) {
      return {
        type: 'address',
        pubkey: coord.pubkey,
        identifier: coord.identifier,
      };
    }
  }

  return null;
}
