import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

import { parseAddressCoordinate, parseAttestation, type AssertionRef } from '@/lib/attestation';

type AssertionEventMap = Record<string, NostrEvent>;

export function useAssertionEvents(attestations: NostrEvent[]) {
  const { nostr } = useNostr();

  const refs = useMemo(() => {
    const values: AssertionRef[] = [];
    for (const event of attestations) {
      const parsed = parseAttestation(event);
      if (parsed.assertionRef) values.push(parsed.assertionRef);
    }
    return values;
  }, [attestations]);

  return useQuery({
    queryKey: ['nostr', 'assertion-events', attestations.map((e) => e.id)],
    queryFn: async () => {
      const eIds = refs.filter((r) => r.type === 'e').map((r) => r.value);
      const aCoords = refs.filter((r) => r.type === 'a').map((r) => r.value);

      const queries = [] as Promise<NostrEvent[]>[];
      if (eIds.length > 0) {
        queries.push(nostr.query([{ ids: eIds, limit: eIds.length }], { signal: AbortSignal.timeout(5000) }));
      }

      if (aCoords.length > 0) {
        const coordinateFilters = aCoords
          .map(parseAddressCoordinate)
          .filter((value): value is NonNullable<typeof value> => value !== null)
          .map((coord) => ({
            kinds: [coord.kind],
            authors: [coord.pubkey],
            '#d': [coord.identifier],
            limit: 1,
          }));

        if (coordinateFilters.length > 0) {
          queries.push(nostr.query(coordinateFilters, { signal: AbortSignal.timeout(5000) }));
        }
      }

      const settled = await Promise.all(queries);
      const all = settled.flat();

      const byId: AssertionEventMap = {};
      const byAddress: AssertionEventMap = {};

      for (const event of all) {
        byId[event.id] = event;
        const d = event.tags.find(([name]) => name === 'd')?.[1] ?? '';
        const address = `${event.kind}:${event.pubkey}:${d}`;
        byAddress[address] = event;
      }

      return {
        byId,
        byAddress,
      };
    },
    enabled: attestations.length > 0,
  });
}
