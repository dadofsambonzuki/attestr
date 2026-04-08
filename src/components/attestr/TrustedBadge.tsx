import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthor } from '@/hooks/useAuthor';
import type { TrustedAttestorTrustReason } from '@/hooks/useTrustedAttestorsForKind';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { cn } from '@/lib/utils';

interface TrustedBadgeProps {
  trustReason: TrustedAttestorTrustReason;
  className?: string;
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
      <span className="font-mono text-[11px] opacity-70">({compactPubkey(providerPubkey)})</span>
    </p>
  );
}

export function TrustedBadge({ trustReason, className }: TrustedBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'inline-flex w-fit cursor-help items-center rounded-full border border-transparent bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white',
          className,
        )}
      >
        Trusted
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1 text-xs">
          {trustReason.viaDirectList ? <p>Direct trusted list</p> : null}
          {trustReason.providerPubkeys.length > 0 ? (
            <div className="space-y-0.5">
              <p className="font-medium">Delegated provider{trustReason.providerPubkeys.length > 1 ? 's' : ''}:</p>
              {trustReason.providerPubkeys.map((providerPubkey) => (
                <TrustedProviderLine key={providerPubkey} providerPubkey={providerPubkey} />
              ))}
            </div>
          ) : null}
          {!trustReason.viaDirectList && trustReason.providerPubkeys.length === 0 ? (
            <p>Trust source unavailable</p>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
