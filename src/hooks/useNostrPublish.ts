import { useNostr } from "@nostrify/react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { useCurrentUser } from "./useCurrentUser";
import { getSignerPubkey } from "./useSignerPubkey";

import type { NostrEvent } from "@nostrify/nostrify";
import { encodeNpub } from "@/lib/nostrEncodings";

export function useNostrPublish(): UseMutationResult<NostrEvent> {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (t: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => {
      if (user) {
        // Preflight: check the signer's active pubkey before signing anything
        const signerPubkey = await getSignerPubkey(user.signer);
        if (signerPubkey !== null && signerPubkey !== user.pubkey.toLowerCase()) {
          throw new Error(
            `Signer account mismatch: selected ${encodeNpub(user.pubkey)}, signer is ${encodeNpub(signerPubkey)}. Switch your extension to the selected account and try again.`,
          );
        }

        const tags = t.tags ?? [];

        // Add the client tag if it doesn't exist
        if (location.protocol === "https:" && !tags.some(([name]) => name === "client")) {
          tags.push(["client", location.hostname]);
        }

        const event = await user.signer.signEvent({
          kind: t.kind,
          content: t.content ?? "",
          tags,
          created_at: t.created_at ?? Math.floor(Date.now() / 1000),
        });

        // Secondary guard: verify the signed event's pubkey matches (catches non-NIP-07 signers)
        if (event.pubkey.toLowerCase() !== user.pubkey.toLowerCase()) {
          throw new Error(
            `Signer account mismatch: selected ${encodeNpub(user.pubkey)}, signer used ${encodeNpub(event.pubkey)}. Switch your extension to the selected account and try again.`,
          );
        }

        await nostr.event(event, { signal: AbortSignal.timeout(5000) });
        return event;
      } else {
        throw new Error("User is not logged in");
      }
    },
    onError: (error) => {
      console.error("Failed to publish event:", error);
    },
    onSuccess: (data) => {
      console.log("Event published successfully:", data);
    },
  });
}
