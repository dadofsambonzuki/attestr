import { NPool } from '@nostrify/nostrify';
import type { NRelay, NostrEvent, NostrFilter, NPoolOpts } from '@nostrify/nostrify';

import { ATTESTR_RELAY_URL, ATTESTATION_RELAY_KINDS } from '@/lib/attestation';

/**
 * How long the user's own relays get to add to what the attestr relay already
 * returned. The attestr relay holds every attestation (it sweeps them from the
 * public relays), so its answer alone is renderable; this only bounds the wait
 * for copies elsewhere and for events the sweep has not picked up yet.
 */
export const SECONDARY_RELAY_TIMEOUT_MS = 1500;

/** True when a query asks for any kind the attestr relay is the home of. */
export function touchesAttestationKinds(filters: NostrFilter[]): boolean {
  return filters.some((filter) =>
    (filter.kinds ?? []).some((kind) => ATTESTATION_RELAY_KINDS.includes(kind)),
  );
}

/**
 * Query the attestr relay *and* the user's read relays together.
 *
 * For events that are not attestation kinds but are still worth finding in our
 * relay - the assertions an attestation points at, which the relay crawls in.
 * They are small id/coordinate lookups, so there is nothing to prioritise: ask
 * everywhere at once, including the attestr relay even when the user's own
 * relay list does not mention it.
 */
export function queryIncludingAttestr(
  nostr: NPool,
  filters: NostrFilter[],
  readRelays: string[],
  opts: { signal?: AbortSignal } = {},
): Promise<NostrEvent[]> {
  const relays = Array.from(new Set([ATTESTR_RELAY_URL, ...readRelays]));
  return nostr.query(filters, { relays, signal: opts.signal });
}

/**
 * Merge event batches into one result set.
 *
 * Addressable and replaceable events are resolved to their newest version
 * across batches, which is what `NPool.query` does inside a single call but
 * cannot do when the answers come from two separate calls.
 */
export function mergeAttestationEvents(...batches: NostrEvent[][]): NostrEvent[] {
  const seen = new Set<string>();
  const resolved = new Map<string, NostrEvent>();

  for (const event of batches.flat()) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);

    let key: string;
    if (event.kind >= 30000 && event.kind < 40000) {
      const d = event.tags.find(([name]) => name === 'd')?.[1] ?? '';
      key = `${event.kind}:${event.pubkey}:${d}`;
    } else if (event.kind >= 10000 && event.kind < 20000) {
      key = `${event.kind}:${event.pubkey}`;
    } else {
      key = event.id;
    }

    const previous = resolved.get(key);
    if (
      !previous
      || event.created_at > previous.created_at
      || (event.created_at === previous.created_at && event.id > previous.id)
    ) {
      resolved.set(key, event);
    }
  }

  return [...resolved.values()].sort(
    (a, b) => b.created_at - a.created_at || (a.id < b.id ? -1 : 1),
  );
}

function withTimeout(promise: Promise<NostrEvent[]>, ms: number): Promise<NostrEvent[]> {
  if (ms <= 0) return Promise.resolve([]);

  return Promise.race([
    promise,
    new Promise<NostrEvent[]>((resolve) => {
      setTimeout(() => resolve([]), ms);
    }),
  ]);
}

/**
 * Where an event should be published.
 *
 * Attestation traffic always reaches the attestr relay, even when the author's
 * NIP-65 list does not name it: an attestation published only elsewhere waits
 * for the relay's 15-minute sweep, and a revocation that never arrives is
 * worse than one that arrives twice. Deletions and comments are included when
 * their `k` tag names an attestation kind.
 */
export function routeEvent(event: NostrEvent, writeRelays: string[]): string[] {
  const relays = new Set(writeRelays);

  const kTags = event.tags
    .filter(([name]) => name === 'k')
    .map(([, value]) => Number.parseInt(value, 10))
    .filter((kind) => Number.isFinite(kind));

  const referencesAttestationKind = kTags.some((kind) => ATTESTATION_RELAY_KINDS.includes(kind));

  if (
    ATTESTATION_RELAY_KINDS.includes(event.kind)
    || (event.kind === 5 && referencesAttestationKind)
    || (event.kind === 1111 && referencesAttestationKind)
  ) {
    relays.add(ATTESTR_RELAY_URL);
  }

  return [...relays];
}

/**
 * The relay pool, with attestation reads answered attestr-first.
 *
 * A plain `NPool` sends every filter to every read relay at once, so the
 * attestr relay has no priority and a slow relay delays the whole answer. This
 * pool asks the attestr relay alone, then gives the user's other read relays a
 * bounded window to add anything else, and resolves the newest version of each
 * addressable event across both answers.
 *
 * Queries that name their own relays (`{ relays: [...] }`, `pool.group(...)`,
 * `pool.relay(...)`) are passed through untouched, as are queries for kinds the
 * attestr relay does not carry.
 */
export class AttestationPriorityPool extends NPool {
  private readonly getReadRelays: () => string[];

  constructor(opts: NPoolOpts<NRelay>, getReadRelays: () => string[]) {
    super(opts);
    this.getReadRelays = getReadRelays;
  }

  override async query(
    filters: NostrFilter[],
    opts?: { signal?: AbortSignal; relays?: string[] },
  ): Promise<NostrEvent[]> {
    if (opts?.relays || !touchesAttestationKinds(filters)) {
      return super.query(filters, opts);
    }

    const primary = await super
      .query(filters, { relays: [ATTESTR_RELAY_URL], signal: opts?.signal })
      .catch(() => [] as NostrEvent[]);

    const others = this.getReadRelays().filter((url) => url !== ATTESTR_RELAY_URL);
    if (others.length === 0) {
      return primary;
    }

    const secondary = await withTimeout(
      super
        .query(filters, { relays: others, signal: opts?.signal })
        .catch(() => [] as NostrEvent[]),
      SECONDARY_RELAY_TIMEOUT_MS,
    );

    return mergeAttestationEvents(primary, secondary);
  }
}
