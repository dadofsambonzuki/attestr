import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

const viewerByKind: Record<number, string> = {
  1: 'https://jumble.social',
};

const fallbackViewer = 'https://njump.me';

export function getEventViewerUrl(event: NostrEvent): string {
  const base = viewerByKind[event.kind] ?? fallbackViewer;

  if (event.kind >= 30000 && event.kind < 40000) {
    const d = event.tags.find(([name]) => name === 'd')?.[1] ?? '';
    const naddr = nip19.naddrEncode({
      kind: event.kind,
      pubkey: event.pubkey,
      identifier: d,
    });
    return `${base}/${naddr}`;
  }

  const note = nip19.noteEncode(event.id);
  return `${base}/${note}`;
}
