import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Zap } from 'lucide-react';
import type { Event } from 'nostr-tools';

interface ZapButtonProps {
  target: Event;
  className?: string;
  showCount?: boolean;
  zapData?: { count: number; totalSats: number; isLoading?: boolean };
}

export function ZapButton({
  target,
  className = "text-xs ml-1",
  showCount = true,
  zapData: externalZapData
}: ZapButtonProps) {
  const { user } = useCurrentUser();
  const { webln, activeNWC } = useWallet();

  // Only fetch data if not provided externally
  const { totalSats: fetchedTotalSats, isLoading } = useZaps(
    externalZapData ? [] : target ?? [], // Empty array prevents fetching if external data provided
    webln,
    activeNWC
  );

  // Don't show zap button if user is not logged in or is the author
  if (!user || !target || user.pubkey === target.pubkey) {
    return null;
  }

  // Use external data if provided, otherwise use fetched data
  const totalSats = externalZapData?.totalSats ?? fetchedTotalSats;
  const showLoading = externalZapData?.isLoading || isLoading;

  return (
    <ZapDialog target={target}>
      <div className={`flex items-center gap-1 ${className}`}>
        <Zap className="h-4 w-4" />
        <span className="text-xs">
          {showLoading ? (
            '...'
          ) : showCount && totalSats > 0 ? (
            `${totalSats.toLocaleString()}`
          ) : (
            'Zap'
          )}
        </span>
      </div>
    </ZapDialog>
  );
}
