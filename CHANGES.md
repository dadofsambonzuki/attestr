# Trusted Lists Migration - PR Summary

## Branch
`feat/trusted-lists-migration`

## Overview
Implements migration from Attestr-specific NIP kinds (31873, 31874, 11871) to standardized Trusted Lists kinds (30392-30395) per the [migration guide](./docs/trusted-lists-migration-guide.md).

## Changes

### 1. `src/lib/nostrKinds.ts`
- Added Trusted Lists kinds 30392-30395 with names
- Marked legacy kinds 31873 and 31874 as "(Legacy)"

### 2. `src/lib/attestation.ts`
New exports added:

**Constants:**
- `TRUSTED_LISTS_KIND = 30392`
- `TRUSTED_LISTS_KIND_MAX = 30395`
- `TL_TAG_TRUSTED_ATTESTORS = 'trusted-attestors'`
- `TL_TAG_TRUSTED_ATTESTOR = 'trusted-attestor'`
- `TL_TAG_KIND_PREFIX = 'k:'`
- `TL_TAG_SUBJECT_PREFIX = 'subject:'`

**New Types:**
- `ParsedTrustedAttestors` - parsed Trusted Lists set event
- `ParsedTrustedAttestor` - parsed Trusted Lists singular edge event
- `MergedTrustedAttestors` - dual-read merged result

**Builder Functions:**
- `buildTrustedAttestorsD(kind)` - builds `d` tag for sets
- `buildTrustedAttestorD(targetPubkey)` - builds `d` tag for singular edges
- `buildTrustedAttestorsEvent(author, kind, attestors)` - builds 30392 event
- `buildTrustedAttestorEvent(author, target, kinds, isSelfDecl)` - builds 30392 event

**Parser Functions:**
- `parseTrustedListKindTags(event)` - extracts `t=k:<kind>` tags
- `parseTrustedAttestors(event)` - parses Trusted Lists set
- `parseTrustedAttestor(event)` - parses Trusted Lists singular edge

**Dual-Write Functions:**
- `buildDualWriteAttestorRecommendation(author, recommender, kinds)` - publishes both 31873 and 30392
- `buildDualWriteAttestorProficiency(author, kinds)` - publishes both 11871 and 30392

**Dual-Read Functions:**
- `mergeTrustedAttestors(trustedListsEvents, legacyEvents)` - prefers Trusted Lists, falls back to legacy
- `mergeTrustedAttestorEdges(trustedListsEvents, legacyEvents)` - merges both sources with deduplication

## Migration Phases
1. **Dual-write**: Publish both legacy and Trusted Lists events
2. **Dual-read**: Prefer Trusted Lists when present, fallback to legacy
3. **Cutover**: Stop writing legacy after adoption threshold

## Conflict Handling
- Newest event wins (by `created_at`)
- On timestamp tie, Trusted Lists preferred
- Kinds and pubkeys deduplicated before computing policy

## Backward Compatibility
- Legacy events still readable
- `t=attestor-recommendation` aliased to `t=trusted-attestor`
- `t=attestor-proficiency` aliased to self-referential `t=trusted-attestor`
