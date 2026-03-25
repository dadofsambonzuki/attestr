import type { NostrEvent } from '@nostrify/nostrify';
import { ExternalLink } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NoteContent } from '@/components/NoteContent';
import { useAuthor } from '@/hooks/useAuthor';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { getEventViewerUrl } from '@/lib/viewers';
import { getProfilePath } from '@/lib/nostrEncodings';
import { encodeEventPointer } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';

interface AssertionPreviewProps {
  event?: NostrEvent;
  fallbackLabel?: string;
}

export function AssertionPreview({ event, fallbackLabel = 'Assertion event unavailable' }: AssertionPreviewProps) {
  const author = useAuthor(event?.pubkey);
  const authorName = event ? getNostrDisplayName(author.data?.metadata, event.pubkey) : 'Unknown author';
  const authorAvatar = event ? author.data?.metadata?.picture : undefined;

  if (!event) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 text-sm text-muted-foreground">
          {fallbackLabel}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7 border border-slate-200">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback className="text-[10px]">{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <a
                href={getProfilePath(event.pubkey)}
                className="truncate text-sm font-medium text-slate-900 hover:underline"
              >
                {authorName}
              </a>
              <p className="truncate text-xs text-muted-foreground">{new Date(event.created_at * 1000).toLocaleString()}</p>
            </div>
          </div>
          <Badge variant="outline" className="max-w-[45%] truncate text-[10px] font-medium">{formatKind(event.kind)}</Badge>
        </div>

        <p className="font-mono break-all text-xs text-muted-foreground">{encodeEventPointer(event)}</p>

        {event.kind === 1 && event.content ? (
          <div className="rounded-md border bg-background p-3 text-sm">
            <NoteContent event={event} className="whitespace-pre-wrap break-words" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Metadata preview only for this kind in Phase 1.
          </p>
        )}

        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={getEventViewerUrl(event)} target="_blank" rel="noreferrer">
            Open external viewer
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
