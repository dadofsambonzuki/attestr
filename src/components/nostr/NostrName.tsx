import { useMemo } from 'react';

import { useAuthor } from '@/hooks/useAuthor';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { getProfilePath } from '@/lib/nostrEncodings';
import { cn } from '@/lib/utils';

interface NostrNameProps {
  pubkey: string;
  className?: string;
}

export function NostrName({ pubkey, className }: NostrNameProps) {
  const author = useAuthor(pubkey);

  const displayName = useMemo(() => {
    return getNostrDisplayName(author.data?.metadata, pubkey);
  }, [author.data?.metadata, pubkey]);

  return (
    <a
      href={getProfilePath(pubkey)}
      className={cn('break-words hover:underline', className)}
    >
      {displayName}
    </a>
  );
}
