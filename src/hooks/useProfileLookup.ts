import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NSchema as n, type NostrMetadata, type NostrFilter, type NostrEvent } from '@nostrify/nostrify';

import { encodeNpub } from '@/lib/nostrEncodings';
import { resolveAuthorInput } from '@/lib/nostrIdentity';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface ProfileLookupOption {
  pubkey: string;
  label: string;
  secondary?: string;
}

export function useProfileLookup(input: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const term = input.trim();
  const normalizedTerm = term.toLowerCase();
  const searchSeed = normalizedTerm.length > 3 ? normalizedTerm.slice(0, 3) : normalizedTerm;

  const followListQuery = useQuery({
    queryKey: ['nostr', 'profile-lookup-follow-list', user?.pubkey ?? ''],
    queryFn: async () => {
      if (!user?.pubkey) return [] as string[];

      const events = await nostr.query([
        {
          kinds: [3],
          authors: [user.pubkey],
          limit: 1,
        },
      ], { signal: AbortSignal.timeout(2500) });

      const latest = events.sort((a, b) => b.created_at - a.created_at)[0];
      if (!latest) return [] as string[];

      return latest.tags
        .filter(([name, value]) => name === 'p' && Boolean(value))
        .map(([, value]) => value)
        .filter((value, index, values) => values.indexOf(value) === index);
    },
    enabled: Boolean(user?.pubkey),
    staleTime: 5 * 60 * 1000,
  });

  const followed = new Set(followListQuery.data ?? []);

  return useQuery({
    queryKey: ['nostr', 'profile-lookup', normalizedTerm, searchSeed, user?.pubkey ?? ''],
    queryFn: async () => {
      if (!term) return [] as ProfileLookupOption[];

      const byPubkey = new Map<string, ProfileLookupOption>();

      const safeQuery = async (filters: NostrFilter[], timeoutMs: number): Promise<NostrEvent[]> => {
        try {
          return await nostr.query(filters, { signal: AbortSignal.timeout(timeoutMs) });
        } catch {
          return [];
        }
      };

      const resolved = await resolveAuthorInput(term);
      if (resolved) {
        const [event] = await safeQuery([{ kinds: [0], authors: [resolved], limit: 1 }], 2500);
        const metadata = parseMetadata(event?.content);
        byPubkey.set(resolved, toProfileOption(resolved, metadata));
      }

      if (term.length >= 2) {
        const metadataSearchTerms = searchSeed && searchSeed !== normalizedTerm
          ? [normalizedTerm, searchSeed]
          : [normalizedTerm];

        for (const candidate of metadataSearchTerms) {
          const events = await safeQuery([{ kinds: [0], search: candidate, limit: 20 }], 3000);

          for (const event of events) {
            if (byPubkey.has(event.pubkey)) continue;
            const metadata = parseMetadata(event.content);
            if (!matchesProfileTerm(metadata, event.pubkey, normalizedTerm, event.content)) continue;
            byPubkey.set(event.pubkey, toProfileOption(event.pubkey, metadata));
          }

          if (byPubkey.size >= 12) break;
        }

        // Prefer surfacing partial matches from the viewer's follow graph.
        if (followed.size > 0) {
          const followPubkeys = [...followed.values()].slice(0, 250);
          const chunks = chunk(followPubkeys, 50);

          for (const pubkeys of chunks) {
            const followedMetadataEvents = await safeQuery([
              {
                kinds: [0],
                authors: pubkeys,
                limit: Math.max(pubkeys.length, 50),
              },
            ], 3500);

            for (const event of followedMetadataEvents) {
              if (byPubkey.has(event.pubkey)) continue;
              const metadata = parseMetadata(event.content);
              if (!matchesProfileTerm(metadata, event.pubkey, normalizedTerm, event.content)) continue;
              byPubkey.set(event.pubkey, toProfileOption(event.pubkey, metadata));
              if (byPubkey.size >= 20) break;
            }

            if (byPubkey.size >= 20) break;
          }
        }

        // Some relays only return exact-ish results for `search` on kind 0.
        // Fallback to paginated metadata scans and filter client-side for partial matches.
        if (byPubkey.size < 6) {
          let until: number | undefined;

          for (let page = 0; page < 4; page += 1) {
            const pageEvents = await safeQuery([
              {
                kinds: [0],
                limit: 500,
                ...(typeof until === 'number' ? { until } : {}),
              },
            ], 3500);

            if (pageEvents.length === 0) break;

            for (const event of pageEvents) {
              if (byPubkey.has(event.pubkey)) continue;
              const metadata = parseMetadata(event.content);
              if (!matchesProfileTerm(metadata, event.pubkey, normalizedTerm, event.content)) continue;
              byPubkey.set(event.pubkey, toProfileOption(event.pubkey, metadata));
              if (byPubkey.size >= 12) break;
            }

            if (byPubkey.size >= 12) break;

            const oldestCreatedAt = Math.min(...pageEvents.map((event) => event.created_at));
            if (!Number.isFinite(oldestCreatedAt)) break;
            until = oldestCreatedAt - 1;
          }
        }

        // Final fallback: search recent note authors by term, then resolve profile metadata.
        // This helps when relays don't index kind:0 search well for partial matches.
        if (byPubkey.size < 6) {
          const noteSearchTerms = searchSeed && searchSeed !== normalizedTerm
            ? [normalizedTerm, searchSeed]
            : [normalizedTerm];

          const noteHits: NostrEvent[] = [];
          const seenNoteIds = new Set<string>();

          for (const candidate of noteSearchTerms) {
            const hits = await safeQuery([
              {
                kinds: [1, 30023],
                search: candidate,
                limit: 120,
              },
            ], 3500);

            for (const event of hits) {
              if (seenNoteIds.has(event.id)) continue;
              seenNoteIds.add(event.id);
              noteHits.push(event);
            }
          }

          const candidateAuthors = [...new Set(noteHits.map((event) => event.pubkey))]
            .filter((pubkey) => !byPubkey.has(pubkey))
            .slice(0, 80);

          if (candidateAuthors.length > 0) {
            const chunks = chunk(candidateAuthors, 40);

            for (const authorChunk of chunks) {
              const authorMetadata = await safeQuery([
                {
                  kinds: [0],
                  authors: authorChunk,
                  limit: authorChunk.length,
                },
              ], 3000);

              for (const event of authorMetadata) {
                if (byPubkey.has(event.pubkey)) continue;
                const metadata = parseMetadata(event.content);
                if (!matchesProfileTerm(metadata, event.pubkey, normalizedTerm, event.content)) continue;
                byPubkey.set(event.pubkey, toProfileOption(event.pubkey, metadata));
                if (byPubkey.size >= 12) break;
              }

              if (byPubkey.size >= 12) break;
            }
          }
        }
      }

      return [...byPubkey.values()]
        .map((option) => ({
          option,
          followed: followed.has(option.pubkey),
          score: getSearchScore(option, normalizedTerm),
        }))
        .sort((a, b) => {
          if (a.followed !== b.followed) return a.followed ? -1 : 1;
          if (a.score !== b.score) return b.score - a.score;
          return a.option.label.localeCompare(b.option.label);
        })
        .map((entry) => entry.option);
    },
    enabled: term.length > 0,
    staleTime: 60 * 1000,
  });
}

function matchesProfileTerm(
  metadata: NostrMetadata | undefined,
  pubkey: string,
  term: string,
  rawContent?: string,
): boolean {
  if (!term) return false;

  const candidates = [
    metadata?.name,
    metadata?.display_name,
    metadata?.nip05,
    metadata?.about,
    rawContent,
    encodeNpub(pubkey),
    pubkey,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return candidates.some((value) => value.includes(term));
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

function getSearchScore(option: ProfileLookupOption, term: string): number {
  const label = option.label.toLowerCase();
  const secondary = option.secondary?.toLowerCase() ?? '';

  if (label === term || secondary === term) return 3;
  if (label.startsWith(term) || secondary.startsWith(term)) return 2;
  if (label.includes(term) || secondary.includes(term)) return 1;
  return 0;
}

function parseMetadata(content: string | undefined): NostrMetadata | undefined {
  if (!content) return undefined;

  try {
    return n.json().pipe(n.metadata()).parse(content);
  } catch {
    return undefined;
  }
}

function toProfileOption(pubkey: string, metadata?: NostrMetadata): ProfileLookupOption {
  const displayName = metadata?.display_name ?? metadata?.name ?? metadata?.nip05 ?? encodeNpub(pubkey);

  return {
    pubkey,
    label: displayName,
    secondary: metadata?.nip05 ?? encodeNpub(pubkey),
  };
}
