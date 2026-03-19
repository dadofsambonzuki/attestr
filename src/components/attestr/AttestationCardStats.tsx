import type { NostrEvent } from '@nostrify/nostrify';

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

import { MessageSquare, Zap } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useZaps } from '@/hooks/useZaps';

interface AttestationCardStatsProps {
  event: NostrEvent;
}

export function AttestationCardStats({ event }: AttestationCardStatsProps) {
  const { nostr } = useNostr();
  const { webln, activeNWC } = useWallet();
  const { totalSats } = useZaps(event, webln, activeNWC);

  const { data: commentCount = 0 } = useQuery({
    queryKey: ['nostr', 'comment-count', event.id],
    queryFn: async () => {
      const comments = await nostr.query([
        {
          kinds: [1111],
          '#E': [event.id],
          limit: 500,
        },
      ], { signal: AbortSignal.timeout(5000) });

      return comments.length;
    },
  });

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="h-3.5 w-3.5" />
        {commentCount}
      </span>
      <span className="inline-flex items-center gap-1">
        <Zap className="h-3.5 w-3.5" />
        {totalSats}
      </span>
    </div>
  );
}
