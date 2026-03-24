import type { NostrEvent } from '@nostrify/nostrify';

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

import { MessageSquare, Zap } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useZaps } from '@/hooks/useZaps';

interface AttestationCardStatsProps {
  event: NostrEvent;
  onCommentsClick?: () => void;
  onZapsClick?: () => void;
}

export function AttestationCardStats({ event, onCommentsClick, onZapsClick }: AttestationCardStatsProps) {
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
      <button
        type="button"
        onClick={onCommentsClick}
        disabled={!onCommentsClick}
        className="inline-flex items-center gap-1 hover:text-foreground disabled:cursor-default disabled:opacity-70"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {commentCount}
      </button>
      <button
        type="button"
        onClick={onZapsClick}
        disabled={!onZapsClick}
        className="inline-flex items-center gap-1 hover:text-foreground disabled:cursor-default disabled:opacity-70"
      >
        <Zap className="h-3.5 w-3.5" />
        {totalSats}
      </button>
    </div>
  );
}
