import type { NostrEvent } from '@nostrify/nostrify';
import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NoteContent } from '@/components/NoteContent';
import { getEventViewerUrl } from '@/lib/viewers';
import { encodeEventPointer } from '@/lib/nostrEncodings';

interface AssertionPreviewProps {
  event?: NostrEvent;
  fallbackLabel?: string;
}

export function AssertionPreview({ event, fallbackLabel = 'Assertion event unavailable' }: AssertionPreviewProps) {
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Kind {event.kind}</span>
          <span>•</span>
          <span className="font-mono break-all">{encodeEventPointer(event)}</span>
          <span>•</span>
          <span>{new Date(event.created_at * 1000).toLocaleString()}</span>
        </div>

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
