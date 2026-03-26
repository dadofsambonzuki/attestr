import type { NostrEvent } from '@nostrify/nostrify';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { useAuthor } from '@/hooks/useAuthor';
import { encodeEventPointer, encodeNpub, getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { AssertionContentRenderer } from './AssertionContentRenderer';
import { AttestAssertionDialog } from './AttestAssertionDialog';
import { RequestAssertionDialog } from './RequestAssertionDialog';

interface AssertionDetailContentProps {
  assertion: NostrEvent;
}

export function AssertionDetailContent({ assertion }: AssertionDetailContentProps) {
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const pointer = encodeEventPointer(assertion);
  const authorNpub = encodeNpub(assertion.pubkey);
  const author = useAuthor(assertion.pubkey);
  const authorName = getNostrDisplayName(author.data?.metadata, assertion.pubkey);
  const authorAvatar = author.data?.metadata?.picture;

  return (
    <div className="mt-2 min-w-0 space-y-6">
      <div className="rounded-md border bg-muted/30 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Event pointer</p>
        <p className="mt-1 break-all font-mono text-xs text-foreground">{pointer}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{formatKind(assertion.kind)}</Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAttestDialogOpen(true)}
        >
          Attest
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRequestDialogOpen(true)}
        >
          Request
        </Button>
      </div>

      <div className="grid min-w-0 gap-3 rounded-md border p-4">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Author</p>
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7 border border-slate-200">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback className="text-[10px]">{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <a
              href={getProfilePath(assertion.pubkey)}
              className="truncate text-sm hover:underline"
            >
              {authorName}
            </a>
          </div>
          <p className="break-all font-mono text-xs text-muted-foreground">{authorNpub}</p>
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Kind</p>
          <p className="text-sm">{formatKind(assertion.kind)}</p>
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
          <p className="text-sm">{new Date(assertion.created_at * 1000).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Assertion content</p>
        <div className="min-w-0 rounded-md border p-3">
          <AssertionContentRenderer event={assertion} mode="full" />
        </div>
      </div>

      <CommentsSection root={assertion} title="Comments" />

      <AttestAssertionDialog
        assertionEvent={assertion}
        open={attestDialogOpen}
        onOpenChange={setAttestDialogOpen}
      />

      <RequestAssertionDialog
        assertionEvent={assertion}
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
      />
    </div>
  );
}
