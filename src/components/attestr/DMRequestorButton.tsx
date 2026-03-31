import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DMChatArea } from '@/components/dm/DMChatArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { getNostrDisplayName } from '@/lib/nostrDisplay';

interface DMRequestorButtonProps {
  pubkey: string;
}

export function DMRequestorButton({ pubkey }: DMRequestorButtonProps) {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const author = useAuthor(pubkey);
  const displayName = getNostrDisplayName(author.data?.metadata, pubkey);

  // Don't show if not logged in or would be DMing yourself
  if (!user || user.pubkey === pubkey) return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="h-4 w-4" />
        DM {displayName}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[80vh] max-h-[680px] w-[95vw] flex-col gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b px-4 py-3">
            <DialogTitle className="text-sm font-medium">Message {displayName}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            <DMChatArea pubkey={pubkey} className="h-full" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
