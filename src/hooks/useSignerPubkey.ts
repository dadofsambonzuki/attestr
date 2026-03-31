import { useEffect, useState } from 'react';
import { useCurrentUser } from './useCurrentUser';

/**
 * Resolves the actual pubkey the current signer will use.
 * For NIP-07 extension logins, calls window.nostr.getPublicKey() which reflects
 * the currently active extension account — without signing any event.
 * Re-checks whenever the selected app user changes.
 */
export function useSignerPubkey() {
  const { user } = useCurrentUser();
  const [signerPubkey, setSignerPubkey] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!user) {
      setSignerPubkey(null);
      return;
    }

    let cancelled = false;
    setIsFetching(true);

    getSignerPubkey(user.signer).then((pubkey) => {
      if (!cancelled) {
        setSignerPubkey(pubkey);
        setIsFetching(false);
      }
    });

    return () => { cancelled = true; };
  }, [user]);

  return { data: signerPubkey, isFetching };
}

/**
 * Fetch the signer's active pubkey.
 * Prefers window.nostr.getPublicKey() for NIP-07 extensions (no event needed).
 * Falls back to the signer's getPublicKey() method if available.
 */
export async function getSignerPubkey(signer: { getPublicKey?: () => Promise<string> }): Promise<string | null> {
  try {
    // NIP-07: window.nostr.getPublicKey() is the standard way
    const w = window as unknown as { nostr?: { getPublicKey?: () => Promise<string> } };
    if (typeof window !== 'undefined' && w.nostr?.getPublicKey) {
      const pubkey = await w.nostr.getPublicKey();
      return pubkey.toLowerCase();
    }

    // Fallback: some signers expose getPublicKey directly
    if (typeof signer.getPublicKey === 'function') {
      const pubkey = await signer.getPublicKey();
      return pubkey.toLowerCase();
    }

    return null;
  } catch {
    return null;
  }
}
