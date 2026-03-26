import { NKinds, type NostrEvent } from '@nostrify/nostrify';

export const ATTESTATION_KIND = 31871;
export const ATTESTATION_REQUEST_KIND = 31872;
export const ATTESTOR_RECOMMENDATION_KIND = 31873;
export const ATTESTOR_PROFICIENCY_DECLARATION_KIND = 11871;

export const ATTESTATION_STATUSES = [
  'verifying',
  'valid',
  'invalid',
  'revoked',
] as const;

export type AttestationStatus = (typeof ATTESTATION_STATUSES)[number];

export const ATTESTATION_STATUS_DESCRIPTIONS: Record<AttestationStatus, string> = {
  verifying: 'Assessment in progress. Evidence is still being reviewed.',
  valid: 'Assertion is confirmed as accurate for the selected timeframe.',
  invalid: 'Assertion is not supported by available evidence.',
  revoked: 'Previous attestation is withdrawn and should no longer be trusted.',
};

export function getAttestationStatusDescription(status: AttestationStatus): string {
  return ATTESTATION_STATUS_DESCRIPTIONS[status];
}

export type AssertionRef =
  | { type: 'e'; value: string }
  | { type: 'a'; value: string };

export interface ParsedAttestation {
  status?: AttestationStatus;
  validFrom?: number;
  validTo?: number;
  expiration?: number;
  d?: string;
  assertionRef?: AssertionRef;
}

export interface ParsedAttestationRequest {
  d?: string;
  assertionRef?: AssertionRef;
}

export interface ParsedAttestorRecommendation {
  d?: string;
  recommendedAttestor?: string;
  kinds: number[];
}

export interface ParsedAttestorProficiencyDeclaration {
  kinds: number[];
}

export function getTagValue(event: NostrEvent, tagName: string): string | undefined {
  return event.tags.find(([name]) => name === tagName)?.[1];
}

export function parseAttestation(event: NostrEvent): ParsedAttestation {
  const statusTag = getTagValue(event, 's');
  const validFrom = parseUnixTag(event, 'valid_from');
  const validTo = parseUnixTag(event, 'valid_to');
  const expiration = parseUnixTag(event, 'expiration');
  const d = getTagValue(event, 'd');

  const assertionRef = parseAssertionRef(event);

  return {
    status: isAttestationStatus(statusTag) ? statusTag : undefined,
    validFrom,
    validTo,
    expiration,
    d,
    assertionRef,
  };
}

export function parseAttestationRequest(event: NostrEvent): ParsedAttestationRequest {
  return {
    d: getTagValue(event, 'd'),
    assertionRef: parseAssertionRef(event),
  };
}

export function parseAttestorRecommendation(event: NostrEvent): ParsedAttestorRecommendation {
  return {
    d: getTagValue(event, 'd'),
    recommendedAttestor: getTagValue(event, 'p'),
    kinds: parseKindTags(event),
  };
}

export function parseAttestorProficiencyDeclaration(event: NostrEvent): ParsedAttestorProficiencyDeclaration {
  return {
    kinds: parseKindTags(event),
  };
}

export function parseAssertionRef(event: NostrEvent): AssertionRef | undefined {
  const e = getTagValue(event, 'e');
  const a = getTagValue(event, 'a');

  return e
    ? { type: 'e', value: e }
    : a
      ? { type: 'a', value: a }
      : undefined;
}

export function parseKindTags(event: NostrEvent): number[] {
  const deduped = new Set<number>();

  for (const [name, value] of event.tags) {
    if (name !== 'k' || !value) continue;

    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      deduped.add(parsed);
    }
  }

  return [...deduped.values()].sort((a, b) => a - b);
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

export function createAttestationRequestD(requestorPubkey: string, assertionEvent: NostrEvent): string {
  const now = Math.floor(Date.now() / 1000);
  return `${requestorPubkey.slice(0, 8)}:${assertionEvent.id.slice(0, 12)}:${now}`;
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
