import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

import {
  TRUSTED_LISTS_KIND,
  TRUSTED_LISTS_KIND_MAX,
  TRUSTED_SERVICE_PROVIDERS_KIND,
  parseTrustedAttestors,
  parseTrustedServiceProviderDelegations,
} from '@/lib/attestation';
import type { NostrEvent } from '@nostrify/nostrify';

export interface TrustedAttestorTrustReason {
  attestorPubkey: string;
  viaDirectList: boolean;
  providerPubkeys: string[];
}

function newestReplaceable(events: NostrEvent[]): NostrEvent | undefined {
  return events.sort((a, b) => b.created_at - a.created_at)[0];
}

export function useTrustedAttestorsForKind(subjectPubkey?: string, assertionKind?: number) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'trusted-attestors-for-kind', subjectPubkey ?? '', assertionKind ?? -1],
    enabled: Boolean(subjectPubkey && Number.isFinite(assertionKind)),
    queryFn: async () => {
      if (!subjectPubkey || assertionKind === undefined || !Number.isFinite(assertionKind)) {
        return [] as TrustedAttestorTrustReason[];
      }
      const targetKind = assertionKind;

      // Latest kind 10040 event from the subject defines current provider delegations.
      const delegationEvents = await nostr.query([
        {
          kinds: [TRUSTED_SERVICE_PROVIDERS_KIND],
          authors: [subjectPubkey],
          limit: 20,
        },
      ], { signal: AbortSignal.timeout(6000) });

      const newestDelegation = newestReplaceable(delegationEvents);
      const delegations = newestDelegation
        ? parseTrustedServiceProviderDelegations(newestDelegation).filter((entry) => entry.assertionKind === targetKind)
        : [];

      const delegatedProviderPolicies = new Map<string, Set<number>>();
      for (const delegation of delegations) {
        const existing = delegatedProviderPolicies.get(delegation.providerPubkey) ?? new Set<number>();
        existing.add(delegation.listKind);
        delegatedProviderPolicies.set(delegation.providerPubkey, existing);
      }

      const trustMap = new Map<string, { viaDirectList: boolean; providerPubkeys: Set<string> }>();

      const addDirectTrust = (attestorPubkey: string) => {
        const current = trustMap.get(attestorPubkey) ?? { viaDirectList: false, providerPubkeys: new Set<string>() };
        current.viaDirectList = true;
        trustMap.set(attestorPubkey, current);
      };

      const addDelegatedTrust = (attestorPubkey: string, providerPubkey: string) => {
        const current = trustMap.get(attestorPubkey) ?? { viaDirectList: false, providerPubkeys: new Set<string>() };
        current.providerPubkeys.add(providerPubkey);
        trustMap.set(attestorPubkey, current);
      };

      // Direct trust lists authored by the subject.
      const directListEvents = await nostr.query([
        {
          kinds: [TRUSTED_LISTS_KIND, TRUSTED_LISTS_KIND + 1, TRUSTED_LISTS_KIND + 2, TRUSTED_LISTS_KIND_MAX],
          authors: [subjectPubkey],
          limit: 200,
        },
      ], { signal: AbortSignal.timeout(6000) });

      for (const event of directListEvents) {
        const parsed = parseTrustedAttestors(event);
        if (parsed.isProviderOutput) continue;
        if (!parsed.kinds.includes(targetKind)) continue;
        for (const attestor of parsed.attestors) addDirectTrust(attestor);
      }

      // Provider-generated trust lists, constrained by subject's own kind 10040 delegations.
      // TSPs publish either:
      //   - A global list (no subject tag) covering all users who delegate to them
      //   - A subject-specific list (t=subject:<pubkey>) which overrides the global list for that subject
      const providerPubkeys = [...delegatedProviderPolicies.keys()];
      if (providerPubkeys.length > 0) {
        const providerListEvents = await nostr.query([
          {
            kinds: [TRUSTED_LISTS_KIND, TRUSTED_LISTS_KIND + 1, TRUSTED_LISTS_KIND + 2, TRUSTED_LISTS_KIND_MAX],
            authors: providerPubkeys,
            limit: 500,
          },
        ], { signal: AbortSignal.timeout(8000) });

        // Separate subject-specific and global lists per provider.
        // Subject-specific lists override the global list for that provider.
        const subjectSpecific = new Map<string, typeof providerListEvents[number][]>();
        const globalLists = new Map<string, typeof providerListEvents[number][]>();

        for (const event of providerListEvents) {
          const parsed = parseTrustedAttestors(event);

          const allowedListKinds = delegatedProviderPolicies.get(event.pubkey);
          if (!allowedListKinds || !allowedListKinds.has(event.kind)) continue;
          if (!parsed.kinds.includes(targetKind)) continue;

          if (parsed.isProviderOutput) {
            if (parsed.subjectPubkey !== subjectPubkey) continue;
            const arr = subjectSpecific.get(event.pubkey) ?? [];
            arr.push(event);
            subjectSpecific.set(event.pubkey, arr);
          } else {
            const arr = globalLists.get(event.pubkey) ?? [];
            arr.push(event);
            globalLists.set(event.pubkey, arr);
          }
        }

        for (const providerPubkey of providerPubkeys) {
          // Use subject-specific lists if present, otherwise fall back to global.
          const lists = subjectSpecific.has(providerPubkey)
            ? subjectSpecific.get(providerPubkey)!
            : (globalLists.get(providerPubkey) ?? []);

          for (const event of lists) {
            const parsed = parseTrustedAttestors(event);
            for (const attestor of parsed.attestors) addDelegatedTrust(attestor, providerPubkey);
          }
        }
      }

      return [...trustMap.entries()]
        .map(([attestorPubkey, reason]) => ({
          attestorPubkey,
          viaDirectList: reason.viaDirectList,
          providerPubkeys: [...reason.providerPubkeys].sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.attestorPubkey.localeCompare(b.attestorPubkey));
    },
  });
}
