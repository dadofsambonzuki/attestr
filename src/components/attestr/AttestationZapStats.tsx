import type { NostrEvent } from '@nostrify/nostrify';
import { nip57 } from 'nostr-tools';

import { useWallet } from '@/hooks/useWallet';
import { useZaps } from '@/hooks/useZaps';
import { NostrName } from '@/components/nostr/NostrName';
import { ZapButton } from '@/components/ZapButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface AttestationZapStatsProps {
  event: NostrEvent;
}

export function AttestationZapStats({ event }: AttestationZapStatsProps) {
  const { webln, activeNWC } = useWallet();
  const { totalSats, zapCount, zaps, isLoading } = useZaps(event, webln, activeNWC);

  const recentZaps = zaps
    .map((zap) => extractZapEntry(zap))
    .filter((zap): zap is ZapEntry => zap !== null)
    .slice(0, 5);

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

        {recentZaps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No zaps yet</p>
            <p className="text-sm">Send the first zap for this attestation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentZaps.map((zap) => (
              <div key={zap.id} className="rounded-md border bg-muted/30 p-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium"><NostrName pubkey={zap.pubkey} /></p>
                  <p className="text-xs text-muted-foreground">{zap.totalSats.toLocaleString()} sats</p>
                </div>
                {zap.comment ? (
                  <p className="mt-1 text-xs text-slate-600">{zap.comment}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No zap comment.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ZapEntry {
  id: string;
  pubkey: string;
  totalSats: number;
  comment: string;
}

function extractZapEntry(zap: NostrEvent): ZapEntry | null {
  const descriptionTag = zap.tags.find(([name]) => name === 'description')?.[1];
  if (!descriptionTag) return null;

  try {
    const zapRequest = JSON.parse(descriptionTag) as { pubkey?: string; content?: string; tags?: string[][] };
    const pubkey = typeof zapRequest.pubkey === 'string' ? zapRequest.pubkey : '';
    if (!pubkey) return null;

    const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1]
      ?? zapRequest.tags?.find(([name]) => name === 'amount')?.[1];

    let totalSats = 0;
    if (amountTag) {
      const millisats = Number.parseInt(amountTag, 10);
      if (Number.isFinite(millisats) && millisats > 0) {
        totalSats = Math.floor(millisats / 1000);
      }
    }

    if (totalSats === 0) {
      const bolt11 = zap.tags.find(([name]) => name === 'bolt11')?.[1];
      if (bolt11) {
        try {
          totalSats = nip57.getSatoshisAmountFromBolt11(bolt11);
        } catch {
          totalSats = 0;
        }
      }
    }

    return {
      id: zap.id,
      pubkey,
      totalSats,
      comment: zapRequest.content?.trim() ?? '',
    };
  } catch {
    return null;
  }
}
