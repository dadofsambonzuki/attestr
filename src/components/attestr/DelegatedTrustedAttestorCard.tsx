import { useAuthor } from '@/hooks/useAuthor';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { formatKind } from '@/lib/nostrKinds';
import { cn } from '@/lib/utils';

export interface AggregatedDelegatedTrust {
  attestorPubkey: string;
  kinds: number[];
  providerPubkeys: string[];
  createdAt: number;
}

interface DelegatedTrustedAttestorCardProps {
  trust: AggregatedDelegatedTrust;
  className?: string;
}

function compactPubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
}

function ProviderLine({ providerPubkey }: { providerPubkey: string }) {
  const provider = useAuthor(providerPubkey);
  const name = getNostrDisplayName(provider.data?.metadata, providerPubkey);
  return (
    <p className="text-xs">
      <span>{name}</span>{' '}
      <span className="font-mono text-[11px] opacity-70">({compactPubkey(providerPubkey)})</span>
    </p>
  );
}

export function DelegatedTrustedAttestorCard({ trust, className }: DelegatedTrustedAttestorCardProps) {
  const attestor = useAuthor(trust.attestorPubkey);
  const attestorName = getNostrDisplayName(attestor.data?.metadata, trust.attestorPubkey);
  const attestorAvatar = attestor.data?.metadata?.picture;

  return (
    <div
      className={cn(
        'rounded-md border border-emerald-200 bg-emerald-50/50 p-3',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-6 w-6 rounded-full border border-emerald-200 bg-emerald-100">
            {attestorAvatar ? (
              <img
                src={attestorAvatar}
                alt={attestorName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-emerald-700">
                {attestorName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <span className="truncate text-xs font-medium text-slate-800">{attestorName}</span>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
          Delegated
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {trust.kinds.map((kind) => (
          <span
            key={kind}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
          >
            {formatKind(kind)}
          </span>
        ))}
      </div>

      <div className="group relative mt-2">
        <p className="cursor-help text-[10px] text-emerald-600 underline decoration-dotted underline-offset-2">
          via {trust.providerPubkeys.length === 1 ? '1 provider' : `${trust.providerPubkeys.length} providers`}
        </p>
        <div className="pointer-events-none absolute left-0 top-full z-10 hidden rounded-md border border-slate-200 bg-white p-2 shadow-lg group-hover:block min-w-48">
          <div className="space-y-1 text-xs">
            <p className="font-medium">
              Delegated provider{trust.providerPubkeys.length > 1 ? 's' : ''}:
            </p>
            {trust.providerPubkeys.map((pk) => (
              <ProviderLine key={pk} providerPubkey={pk} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
