import { useAuthor } from '@/hooks/useAuthor';
import type { TrustedAttestorTrustReason } from '@/hooks/useTrustedAttestorsForKind';
import { getNostrDisplayName } from '@/lib/nostrDisplay';

interface TrustSourceTooltipContentProps {
  trustReason: TrustedAttestorTrustReason;
}

function compactPubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
}

function TrustedProviderLine({ providerPubkey }: { providerPubkey: string }) {
  const provider = useAuthor(providerPubkey);
  const providerName = getNostrDisplayName(provider.data?.metadata, providerPubkey);

  return (
    <p className="text-xs">
      <span>{providerName}</span>{' '}
      <span className="font-mono text-[11px] text-muted-foreground">({compactPubkey(providerPubkey)})</span>
    </p>
  );
}

export function TrustSourceTooltipContent({ trustReason }: TrustSourceTooltipContentProps) {
  return (
    <div className="space-y-1 text-xs">
      {trustReason.viaDirectList ? <p>Direct trusted list</p> : null}
      {trustReason.providerPubkeys.length > 0 ? (
        <div>
          <p>Delegated provider{trustReason.providerPubkeys.length > 1 ? 's' : ''}:</p>
          {trustReason.providerPubkeys.map((providerPubkey) => (
            <TrustedProviderLine key={providerPubkey} providerPubkey={providerPubkey} />
          ))}
        </div>
      ) : null}
      {!trustReason.viaDirectList && trustReason.providerPubkeys.length === 0 ? (
        <p>Trust source metadata unavailable</p>
      ) : null}
    </div>
  );
}
