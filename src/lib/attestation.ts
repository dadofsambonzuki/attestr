import { NKinds, type NostrEvent } from '@nostrify/nostrify';

// Legacy kinds (for migration reference)
export const ATTESTATION_KIND = 31871;
export const ATTESTATION_REQUEST_KIND = 31872;
export const ATTESTOR_RECOMMENDATION_KIND = 31873;
export const ATTESTOR_PROFICIENCY_DECLARATION_KIND = 11871;

// Trusted Lists kinds (30392-30395)
export const TRUSTED_LISTS_KIND = 30392;
export const TRUSTED_LISTS_KIND_MAX = 30395;

// Trusted Lists tag conventions
export const TL_TAG_TRUSTED_ATTESTORS = 'trusted-attestors';
export const TL_TAG_TRUSTED_ATTESTOR = 'trusted-attestor';
export const TL_TAG_KIND_PREFIX = 'k:';
export const TL_TAG_SUBJECT_PREFIX = 'subject:';

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

// Trusted Lists parsed types
export interface ParsedTrustedAttestors {
  d: string;
  kinds: number[];
  attestors: string[];
  isProviderOutput: boolean;
  subjectPubkey?: string;
}

export interface ParsedTrustedAttestor {
  d: string;
  targetPubkey: string;
  kinds: number[];
  isSelfDeclaration: boolean;
}

export function getTagValue(event: NostrEvent, tagName: string): string | undefined {
  return event.tags.find(([name]) => name === tagName)?.[1];
}

export function getTagValues(event: NostrEvent, tagName: string): string[] {
  return event.tags.filter(([name]) => name === tagName).map(([, value]) => value).filter(Boolean);
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

export function parseTrustedListKindTags(event: NostrEvent): number[] {
  const deduped = new Set<number>();

  for (const [name, value] of event.tags) {
    if (name !== 't' || !value) continue;
    if (!value.startsWith(TL_TAG_KIND_PREFIX)) continue;

    const kindStr = value.slice(TL_TAG_KIND_PREFIX.length);
    const parsed = Number.parseInt(kindStr, 10);
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

export function createAttestorRecommendationD(recommenderPubkey: string, recommendedAttestorPubkey: string): string {
  const now = Math.floor(Date.now() / 1000);
  return `${recommenderPubkey.slice(0, 8)}:${recommendedAttestorPubkey.slice(0, 8)}:${now}`;
}

// Trusted Lists builders
export function buildTrustedAttestorsD(kind: number): string {
  return `trusted-attestors:${kind}`;
}

export function buildTrustedAttestorD(targetPubkey: string): string {
  return `trusted-attestor:${targetPubkey}`;
}

export function buildProviderOutputTrustedAttestorsD(subjectPubkey: string, kind: number): string {
  return `trusted-attestors:${subjectPubkey}:${kind}`;
}

export function buildProviderOutputTrustedAttestorD(subjectPubkey: string, targetPubkey: string): string {
  return `trusted-attestor:${subjectPubkey}:${targetPubkey}`;
}

export function buildTrustedAttestorsEvent(
  authorPubkey: string,
  kind: number,
  attestorPubkeys: string[],
): NostrEvent {
  const d = buildTrustedAttestorsD(kind);
  const tags: string[][] = [
    ['d', d],
    ['t', TL_TAG_TRUSTED_ATTESTORS],
    ['t', `${TL_TAG_KIND_PREFIX}${kind}`],
    ...attestorPubkeys.map(pk => ['p', pk] as string[]),
  ];

  return {
    kind: TRUSTED_LISTS_KIND,
    pubkey: authorPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
    id: '',
    sig: '',
  };
}

export function buildTrustedAttestorEvent(
  authorPubkey: string,
  targetPubkey: string,
  kinds: number[],
  isSelfDeclaration: boolean = false,
): NostrEvent {
  const d = buildTrustedAttestorD(targetPubkey);
  const tags: string[][] = [
    ['d', d],
    ['t', TL_TAG_TRUSTED_ATTESTOR],
    ...kinds.map(k => ['t', `${TL_TAG_KIND_PREFIX}${k}`] as string[]),
    ['p', targetPubkey],
  ];

  return {
    kind: TRUSTED_LISTS_KIND,
    pubkey: authorPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
    id: '',
    sig: '',
  };
}

// Trusted Lists parsers
export function parseTrustedAttestors(event: NostrEvent): ParsedTrustedAttestors {
  const d = getTagValue(event, 'd') ?? '';
  const kinds = parseTrustedListKindTags(event);
  const pTags = getTagValues(event, 'p');
  const subjectTag = getTagValues(event, 't').find(t => t.startsWith(TL_TAG_SUBJECT_PREFIX));
  const subjectPubkey = subjectTag?.slice(TL_TAG_SUBJECT_PREFIX.length);
  const isProviderOutput = !!subjectPubkey;

  return {
    d,
    kinds,
    attestors: pTags,
    isProviderOutput,
    subjectPubkey,
  };
}

export function parseTrustedAttestor(event: NostrEvent): ParsedTrustedAttestor {
  const d = getTagValue(event, 'd') ?? '';
  const pTags = getTagValues(event, 'p');
  const targetPubkey = pTags[0] ?? '';
  const kinds = parseTrustedListKindTags(event);
  const isSelfDeclaration = event.pubkey === targetPubkey;

  return {
    d,
    targetPubkey,
    kinds,
    isSelfDeclaration,
  };
}

// Dual-write helpers: publish both legacy and Trusted Lists
export function buildDualWriteAttestorRecommendation(
  authorPubkey: string,
  recommenderPubkey: string,
  kinds: number[],
): NostrEvent[] {
  const legacyD = createAttestorRecommendationD(authorPubkey, recommenderPubkey);
  const legacyEvent: NostrEvent = {
    kind: ATTESTOR_RECOMMENDATION_KIND,
    pubkey: authorPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', legacyD],
      ['p', recommenderPubkey],
      ...kinds.map(k => ['k', String(k)] as string[]),
    ],
    content: '',
    id: '',
    sig: '',
  };

  const trustedEvent = buildTrustedAttestorEvent(authorPubkey, recommenderPubkey, kinds, false);

  return [legacyEvent, trustedEvent];
}

export function buildDualWriteAttestorProficiency(
  authorPubkey: string,
  kinds: number[],
): NostrEvent[] {
  const legacyEvent: NostrEvent = {
    kind: ATTESTOR_PROFICIENCY_DECLARATION_KIND,
    pubkey: authorPubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: kinds.map(k => ['k', String(k)] as string[]),
    content: '',
    id: '',
    sig: '',
  };

  const trustedEvent = buildTrustedAttestorEvent(authorPubkey, authorPubkey, kinds, true);

  return [legacyEvent, trustedEvent];
}

export function buildDualWriteTrustedAttestors(
  authorPubkey: string,
  kind: number,
  attestorPubkeys: string[],
): NostrEvent[] {
  // Legacy: 31874 doesn't exist in current codebase, but migration guide references it
  // For now, only publish Trusted Lists
  const trustedEvent = buildTrustedAttestorsEvent(authorPubkey, kind, attestorPubkeys);
  return [trustedEvent];
}

// Dual-read helpers: prefer Trusted Lists, fallback to legacy
export interface MergedTrustedAttestors {
  kinds: number[];
  attestors: Set<string>;
  source: 'trusted_lists' | 'legacy' | 'merged';
  newestTimestamp: number;
}

export function mergeTrustedAttestors(
  trustedListsEvents: NostrEvent[],
  legacyEvents: NostrEvent[],
): MergedTrustedAttestors | null {
  const allEvents = [...trustedListsEvents, ...legacyEvents];
  if (allEvents.length === 0) return null;

  // Pick newest
  const newest = allEvents.reduce((a, b) => a.created_at > b.created_at ? a : b);
  const useTrustedLists = trustedListsEvents.length > 0 &&
    (legacyEvents.length === 0 || newest.kind >= TRUSTED_LISTS_KIND);

  if (useTrustedLists) {
    const parsed = trustedListsEvents.map(parseTrustedAttestors);
    const attestors = new Set<string>();
    const kindsSet = new Set<number>();

    for (const p of parsed) {
      for (const a of p.attestors) attestors.add(a);
      for (const k of p.kinds) kindsSet.add(k);
    }

    return {
      kinds: [...kindsSet].sort((a, b) => a - b),
      attestors,
      source: 'trusted_lists',
      newestTimestamp: newest.created_at,
    };
  } else {
    // Legacy 31874 fallback
    const attestors = new Set<string>();
    const kindsSet = new Set<number>();

    for (const event of legacyEvents) {
      for (const [name, value] of event.tags) {
        if (name === 'p' && value) attestors.add(value);
        if (name === 'k' && value) {
          const parsed = Number.parseInt(value, 10);
          if (Number.isFinite(parsed)) kindsSet.add(parsed);
        }
      }
    }

    return {
      kinds: [...kindsSet].sort((a, b) => a - b),
      attestors,
      source: 'legacy',
      newestTimestamp: newest.created_at,
    };
  }
}

export function mergeTrustedAttestorEdges(
  trustedListsEvents: NostrEvent[],
  legacyEvents: NostrEvent[],
): Map<string, { kinds: number[]; isSelfDeclaration: boolean; newestTimestamp: number }> {
  const result = new Map<string, { kinds: number[]; isSelfDeclaration: boolean; newestTimestamp: number }>();

  // Process Trusted Lists events
  for (const event of trustedListsEvents) {
    const parsed = parseTrustedAttestor(event);
    const existing = result.get(parsed.targetPubkey);

    if (!existing || event.created_at > existing.newestTimestamp) {
      result.set(parsed.targetPubkey, {
        kinds: parsed.kinds,
        isSelfDeclaration: parsed.isSelfDeclaration,
        newestTimestamp: event.created_at,
      });
    } else if (event.created_at === existing.newestTimestamp) {
      // Merge kinds
      const mergedKinds = new Set([...existing.kinds, ...parsed.kinds]);
      existing.kinds = [...mergedKinds].sort((a, b) => a - b);
    }
  }

  // Process legacy events (31873 -> trusted-attestor, 11871 -> self-declaration)
  for (const event of legacyEvents) {
    const pTags = getTagValues(event, 'p');
    const kinds = parseKindTags(event);
    const targetPubkey = pTags[0];

    if (!targetPubkey) continue;

    const isSelfDeclaration = event.pubkey === targetPubkey ||
      event.kind === ATTESTOR_PROFICIENCY_DECLARATION_KIND;

    const existing = result.get(targetPubkey);

    if (!existing || event.created_at > existing.newestTimestamp) {
      result.set(targetPubkey, {
        kinds,
        isSelfDeclaration,
        newestTimestamp: event.created_at,
      });
    } else if (event.created_at === existing.newestTimestamp) {
      const mergedKinds = new Set([...existing.kinds, ...kinds]);
      existing.kinds = [...mergedKinds].sort((a, b) => a - b);
    }
  }

  return result;
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
