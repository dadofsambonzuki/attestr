import type { NostrEvent } from '@nostrify/nostrify';

import { useWallet } from '@/hooks/useWallet';
import { useZaps } from '@/hooks/useZaps';
import { NostrName } from '@/components/nostr/NostrName';
import { encodeNpub } from '@/lib/nostrEncodings';
import { ZapButton } from '@/components/ZapButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface AttestationZapStatsProps {
  event: NostrEvent;
}

export function AttestationZapStats({ event }: AttestationZapStatsProps) {
  const { webln, activeNWC } = useWallet();
  const { totalSats, zapCount, zappers, isLoading } = useZaps(event, webln, activeNWC);

  const topZappers = zappers.slice(0, 5);

  return (
    <Card className="rounded-none sm:rounded-lg mx-0 sm:mx-0">
      <CardHeader className="px-2 pt-6 pb-4 sm:p-6">
        <CardTitle className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Zaps</span>
            <span className="text-sm font-normal text-muted-foreground">
              {isLoading ? '(...)' : `(${zapCount})`}
            </span>
          </div>
          <ZapButton target={event} className="h-8 px-2 text-xs" allowSelfZap />
        </CardTitle>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-2 sm:p-6 sm:pt-0 space-y-4">
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Loading...' : `${totalSats.toLocaleString()} sats • ${zapCount} receipts`}
        </p>

        {topZappers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No zaps yet</p>
            <p className="text-sm">Send the first zap for this attestation.</p>
          </div>
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
      </CardContent>
    </Card>
  );
}
