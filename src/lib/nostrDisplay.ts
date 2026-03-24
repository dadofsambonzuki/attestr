import type { NostrMetadata } from '@nostrify/nostrify';

import { genUserName } from '@/lib/genUserName';

export function getNostrDisplayName(metadata: NostrMetadata | undefined, pubkey: string): string {
  return metadata?.display_name ?? metadata?.name ?? genUserName(pubkey);
}
