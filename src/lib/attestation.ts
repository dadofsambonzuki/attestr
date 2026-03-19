import { NKinds, type NostrEvent } from '@nostrify/nostrify';

export const ATTESTATION_KIND = 31871;

export const ATTESTATION_STATUSES = [
  'accepted',
  'rejected',
  'verifying',
  'verified',
  'revoked',
] as const;

export type AttestationStatus = (typeof ATTESTATION_STATUSES)[number];
export type AttestationValidity = 'valid' | 'invalid';

export type AssertionRef =
  | { type: 'e'; value: string }
  | { type: 'a'; value: string }
  | { type: 'p'; value: string };

export interface ParsedAttestation {
  status?: AttestationStatus;
  validity?: AttestationValidity;
  validFrom?: number;
  validTo?: number;
  expiration?: number;
  d?: string;
  assertionRef?: AssertionRef;
}

export function getTagValue(event: NostrEvent, tagName: string): string | undefined {
  return event.tags.find(([name]) => name === tagName)?.[1];
}

export function parseAttestation(event: NostrEvent): ParsedAttestation {
  const statusTag = getTagValue(event, 's');
  const validityTag = getTagValue(event, 'v');
  const validFrom = parseUnixTag(event, 'valid_from');
  const validTo = parseUnixTag(event, 'valid_to');
  const expiration = parseUnixTag(event, 'expiration');
  const d = getTagValue(event, 'd');

  const e = getTagValue(event, 'e');
  const a = getTagValue(event, 'a');
  const p = getTagValue(event, 'p');

  const assertionRef = e
    ? { type: 'e' as const, value: e }
    : a
      ? { type: 'a' as const, value: a }
      : p
        ? { type: 'p' as const, value: p }
        : undefined;

  return {
    status: isAttestationStatus(statusTag) ? statusTag : undefined,
    validity: validityTag === 'valid' || validityTag === 'invalid' ? validityTag : undefined,
    validFrom,
    validTo,
    expiration,
    d,
    assertionRef,
  };
}

export function createAssertionTag(event: NostrEvent): string[] {
  if (NKinds.addressable(event.kind)) {
    return ['a', getAddressCoordinate(event)];
  }

  if (NKinds.replaceable(event.kind)) {
    return ['a', `${event.kind}:${event.pubkey}:`];
  }

  return ['e', event.id];
}

export function getAddressCoordinate(event: NostrEvent): string {
  const d = getTagValue(event, 'd') ?? '';
  return `${event.kind}:${event.pubkey}:${d}`;
}

export function parseAddressCoordinate(coordinate: string): { kind: number; pubkey: string; identifier: string } | null {
  const [kindText, pubkey, ...rest] = coordinate.split(':');
  const kind = Number.parseInt(kindText, 10);

  if (!Number.isFinite(kind) || !pubkey || rest.length === 0) {
    return null;
  }

  return {
    kind,
    pubkey,
    identifier: rest.join(':'),
  };
}

export function createAttestationD(assertionEvent: NostrEvent): string {
  const now = Math.floor(Date.now() / 1000);
  return `${assertionEvent.pubkey.slice(0, 8)}:${assertionEvent.id.slice(0, 12)}:${now}`;
}

export function toUnixTimestamp(dateTimeLocal: string): number | undefined {
  if (!dateTimeLocal) return undefined;
  const ms = Date.parse(dateTimeLocal);
  if (Number.isNaN(ms)) return undefined;
  return Math.floor(ms / 1000);
}

function parseUnixTag(event: NostrEvent, tag: string): number | undefined {
  const value = getTagValue(event, tag);
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isAttestationStatus(value: string | undefined): value is AttestationStatus {
  return !!value && ATTESTATION_STATUSES.includes(value as AttestationStatus);
}
