import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

import { ATTESTATION_KIND } from '@/lib/attestation';
import { resolveAuthorInput } from '@/lib/nostrIdentity';

export interface AttestationFeedFilters {
  attestors: string[];
  statuses: string[];
  assertionKinds: number[];
}

export function useAttestationFeed(filters: AttestationFeedFilters, runKey = 0, limit = 120) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'attestation-feed', filters, limit, runKey],
    queryFn: async () => {
      let authors: string[] | undefined;
      if (filters.attestors.length > 0) {
        const resolvedAuthors: string[] = [];
        for (const attestor of filters.attestors) {
          const resolved = await resolveAuthorInput(attestor);
          if (resolved && !resolvedAuthors.includes(resolved)) {
            resolvedAuthors.push(resolved);
          }
        }
        authors = resolvedAuthors.length > 0 ? resolvedAuthors : undefined;
      }

      const baseFilter = {
        kinds: [ATTESTATION_KIND],
        authors,
        '#s': filters.statuses.length > 0 ? filters.statuses : undefined,
        limit,
      };

      const events = await nostr.query([baseFilter], {
        signal: AbortSignal.timeout(6000),
      });

      return groupLatestByD(events).sort((a, b) => b.created_at - a.created_at);
    },
  });
}

function groupLatestByD(events: NostrEvent[]): NostrEvent[] {
  const byD = new Map<string, NostrEvent>();

  for (const event of events) {
    const d = event.tags.find(([name]) => name === 'd')?.[1] ?? `id:${event.id}`;

    const prev = byD.get(d);
    if (!prev || event.created_at > prev.created_at) {
      byD.set(d, event);
    }
  }

  return [...byD.values()];
}
