import { useEffect, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

import { ATTESTATION_KIND } from '@/lib/attestation';

export function useFeaturedAttestations(naddrs: string[]) {
  const { nostr } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (naddrs.length === 0) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setEvents([]);

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

    if (filters.length === 0) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const byD = new Map<string, NostrEvent>();

    // Give up the loading state after 8s even if not all events arrived
    timeoutRef.current = setTimeout(() => {
      if (isActive) setIsLoading(false);
    }, 8000);

    (async () => {
      try {
        const subscription = nostr.req(filters);
        for await (const msg of subscription) {
          if (!isActive) break;
          if (msg[0] !== 'EVENT') continue;

          const event = msg[2];
          const d = event.tags.find(([name]) => name === 'd')?.[1] ?? event.id;

          const prev = byD.get(d);
          if (!prev || event.created_at > prev.created_at) {
            byD.set(d, event);
            setEvents([...byD.values()]);
            setIsLoading(false);
          }
        }
      } catch {
        // Subscription closed or error — noop
      }
    })();

    return () => {
      isActive = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [naddrs, nostr]);

  return { data: events, isLoading };
}
