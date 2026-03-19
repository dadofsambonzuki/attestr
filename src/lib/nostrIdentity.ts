import { nip19 } from 'nostr-tools';

export function isHex64(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

export function normalizeToPubkey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isHex64(trimmed)) {
    return trimmed.toLowerCase();
  }

  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === 'npub') {
      return decoded.data;
    }
    if (decoded.type === 'nprofile') {
      return decoded.data.pubkey;
    }
  } catch {
    return null;
  }

  return null;
}

export async function resolveNip05ToPubkey(value: string): Promise<string | null> {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return null;

  const [nameRaw, domain] = trimmed.split('@');
  const name = nameRaw || '_';
  if (!domain) return null;

  const url = new URL(`https://${domain}/.well-known/nostr.json`);
  url.searchParams.set('name', name);

  try {
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const json = (await response.json()) as { names?: Record<string, string> };
    const candidate = json.names?.[name];
    return candidate && isHex64(candidate) ? candidate.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function resolveAuthorInput(value: string): Promise<string | null> {
  const fromPubkey = normalizeToPubkey(value);
  if (fromPubkey) return fromPubkey;
  return resolveNip05ToPubkey(value);
}
