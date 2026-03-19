import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

import { resolveAuthorInput, isHex64 } from '@/lib/nostrIdentity';

export interface EventSearchParams {
  query: string;
  author: string;
  kind?: number;
  days: number;
  limit: number;
}

export function useEventSearch(params: EventSearchParams) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'event-search', params],
    queryFn: async () => {
      const filters: NostrFilter[] = [];
      const now = Math.floor(Date.now() / 1000);
      const since = now - params.days * 24 * 60 * 60;
      const maybeKind = Number.isFinite(params.kind) ? [params.kind!] : undefined;

      const authors: string[] = [];
      if (params.author.trim()) {
        const resolved = await resolveAuthorInput(params.author.trim());
        if (resolved) authors.push(resolved);
      }

      const input = params.query.trim();
      if (input) {
        const direct = decodeToDirectFilter(input);
        if (direct) {
          filters.push({ ...direct, limit: params.limit });
        } else {
          filters.push({
            kinds: maybeKind,
            search: input,
            authors: authors.length > 0 ? authors : undefined,
            since,
            limit: params.limit,
          });
        }
      } else {
        filters.push({
          kinds: maybeKind,
          authors: authors.length > 0 ? authors : undefined,
          since,
          limit: params.limit,
        });
      }

      const signal = AbortSignal.timeout(6000);
      const events = await nostr.query(filters, { signal });

      return dedupeById(events).sort((a, b) => b.created_at - a.created_at);
    },
    enabled: Boolean(params.query.trim() || params.author.trim() || Number.isFinite(params.kind)),
  });
}

function decodeToDirectFilter(input: string): NostrFilter | null {
  if (isHex64(input)) {
    return { ids: [input.toLowerCase()], limit: 1 };
  }

  try {
    const decoded = nip19.decode(input);
    switch (decoded.type) {
      case 'note':
        return { ids: [decoded.data], limit: 1 };
      case 'nevent':
        return { ids: [decoded.data.id], limit: 1 };
      case 'naddr':
        return {
          kinds: [decoded.data.kind],
          authors: [decoded.data.pubkey],
          '#d': [decoded.data.identifier],
          limit: 1,
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function dedupeById(events: NostrEvent[]): NostrEvent[] {
  const seen = new Set<string>();
  const unique: NostrEvent[] = [];

  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    unique.push(event);
  }

  return unique;
}
