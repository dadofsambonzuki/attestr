import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

import { ATTESTATION_KIND } from '@/lib/attestation';

export function useFeaturedAttestations(naddrs: string[]) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'featured-attestations', naddrs],
    queryFn: async () => {
      if (naddrs.length === 0) return [];

      const filters: NostrFilter[] = [];

      for (const naddr of naddrs) {
        try {
          const decoded = nip19.decode(naddr.trim());
          if (decoded.type === 'naddr' && decoded.data.kind === ATTESTATION_KIND) {
            filters.push({
              kinds: [decoded.data.kind],
              authors: [decoded.data.pubkey],
              '#d': [decoded.data.identifier],
              limit: 1,
            });
          }
        } catch {
          // Ignore invalid naddrs
        }
      }

      if (filters.length === 0) return [];

      const events = await nostr.query(filters, {
        signal: AbortSignal.timeout(6000),
      });

      // Deduplicate and preserve config order
      const seen = new Set<string>();
      const result: NostrEvent[] = [];

      for (const event of events) {
        if (seen.has(event.id)) continue;
        seen.add(event.id);
        result.push(event);
      }

      return result;
    },
    enabled: naddrs.length > 0,
  });
}
