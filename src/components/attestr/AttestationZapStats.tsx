import type { NostrEvent } from '@nostrify/nostrify';

import { useWallet } from '@/hooks/useWallet';
import { useZaps } from '@/hooks/useZaps';
import { NostrName } from '@/components/nostr/NostrName';
import { encodeNpub } from '@/lib/nostrEncodings';

interface AttestationZapStatsProps {
  event: NostrEvent;
}

export function AttestationZapStats({ event }: AttestationZapStatsProps) {
  const { webln, activeNWC } = useWallet();
  const { totalSats, zapCount, zappers, isLoading } = useZaps(event, webln, activeNWC);

  const topZappers = zappers.slice(0, 5);

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Zaps</p>
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Loading...' : `${totalSats.toLocaleString()} sats • ${zapCount} receipts`}
        </p>
      </div>

      {topZappers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No zaps yet.</p>
      ) : (
        <div className="space-y-2">
          {topZappers.map((zapper) => (
            <div key={zapper.pubkey} className="rounded-md border bg-muted/30 p-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium"><NostrName pubkey={zapper.pubkey} /></p>
                <p className="text-xs text-muted-foreground">{zapper.totalSats.toLocaleString()} sats</p>
              </div>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{encodeNpub(zapper.pubkey)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
