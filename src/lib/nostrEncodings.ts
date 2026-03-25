import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

import { type AssertionRef } from '@/lib/attestation';
import { isHex64 } from '@/lib/nostrIdentity';

export function encodeNpub(pubkey: string): string {
  if (!isHex64(pubkey)) return pubkey;

  try {
    return nip19.npubEncode(pubkey);
  } catch {
    return pubkey;
  }
}

export function getProfilePath(pubkey: string): string {
  return `/profile/${encodeNpub(pubkey)}`;
}

export function getProfilePathFromNpub(npub: string): string {
  return `/profile/${npub}`;
}

export function encodeEventPointer(event: NostrEvent): string {
  if (event.kind >= 30000 && event.kind < 40000) {
    const d = event.tags.find(([name]) => name === 'd')?.[1] ?? '';

    try {
      return nip19.naddrEncode({ kind: event.kind, pubkey: event.pubkey, identifier: d });
    } catch {
      return event.id;
    }
  }

  try {
    return nip19.neventEncode({ id: event.id, author: event.pubkey });
  } catch {
    return event.id;
  }
}

export function encodeEventIdAsNevent(id: string): string {
  if (!isHex64(id)) return id;

  try {
    return nip19.neventEncode({ id });
  } catch {
    return id;
  }
}

export function encodeAssertionRef(ref: AssertionRef): string {
  if (ref.type === 'e') {
    if (!isHex64(ref.value)) return ref.value;

    try {
      return nip19.neventEncode({ id: ref.value });
    } catch {
      return ref.value;
    }
  }

  const coordinate = parseCoordinate(ref.value);
  if (!coordinate) return ref.value;

  try {
    return nip19.naddrEncode({
      kind: coordinate.kind,
      pubkey: coordinate.pubkey,
      identifier: coordinate.identifier,
    });
  } catch {
    return ref.value;
  }
}

function parseCoordinate(value: string): { kind: number; pubkey: string; identifier: string } | null {
  const [kindText, pubkey, ...identifierParts] = value.split(':');
  const kind = Number.parseInt(kindText, 10);
  const identifier = identifierParts.join(':');

  if (!Number.isFinite(kind) || !isHex64(pubkey) || identifierParts.length === 0) {
    return null;
  }

  return { kind, pubkey, identifier };
}
