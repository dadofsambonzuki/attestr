import { AlertTriangle } from 'lucide-react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSignerPubkey } from '@/hooks/useSignerPubkey';
import { useAuthor } from '@/hooks/useAuthor';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { encodeNpub } from '@/lib/nostrEncodings';

/**
 * Shows a warning banner when the extension/signer's active account does not match
 * the account selected in the app. This is a preflight indicator — publishing is
 * still blocked at the useNostrPublish layer if mismatch persists.
 */
export function SignerMismatchWarning() {
  const { user } = useCurrentUser();
  const { data: signerPubkey, isFetching } = useSignerPubkey();

  const selectedAuthor = useAuthor(user?.pubkey);
  const signerAuthor = useAuthor(signerPubkey ?? undefined);

  if (!user || isFetching || !signerPubkey) return null;

  const selectedPubkey = user.pubkey.toLowerCase();
  if (selectedPubkey === signerPubkey) return null;

  const selectedName = getNostrDisplayName(selectedAuthor.data?.metadata, selectedPubkey);
  const signerName = getNostrDisplayName(signerAuthor.data?.metadata, signerPubkey);
  const selectedNpub = encodeNpub(selectedPubkey);
  const signerNpub = encodeNpub(signerPubkey);

  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0 space-y-1">
        <p className="font-medium">Signer account mismatch</p>
        <p className="text-xs text-amber-800">
          Selected: <span className="font-medium">{selectedName}</span>{' '}
          <span className="break-all font-mono text-amber-600">{selectedNpub}</span>
        </p>
        <p className="text-xs text-amber-800">
          Signer: <span className="font-medium">{signerName}</span>{' '}
          <span className="break-all font-mono text-amber-600">{signerNpub}</span>
        </p>
        <p className="text-xs text-amber-700">
          Switch your extension to the selected account before publishing.
        </p>
      </div>
    </div>
  );
}
