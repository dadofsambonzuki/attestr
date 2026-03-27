# Trusted Lists Conventions and Migration Guide

Status: Draft for review

This guide defines a deterministic convention for using Trusted Lists (`30392-30395`) in Attestr, and a migration path from Attestation specific kinds for certain events.

Assumption: Trusted Lists kinds `30392-30395` mirror NIP-85 subject modeling and support `p`, `e`, `a`, `t`, and `i` tags.

## 1) Deterministic Tag Convention

Use `t` tags as the primary semantic namespace, and keep event type discoverable from tags plus kind.

### Required semantics tags

- `t=<type>` where `<type>` is one of:
  - `trusted-attestors`
  - `trusted-attestor`

### Relation dimensions by list type

- `trusted-attestors`
  - exactly one `t=k:<kind>`
  - one or more `p` (trusted attestor pubkeys) 
- `trusted-attestor`
  - exactly one `p` (trusted attestor)
  - one or more `t=k:<kind>`

Self-claim convention:

- `trusted-attestor` where `author == p` is interpreted as attestor proficiency/self-claim.
- `trusted-attestor` where `author != p` is interpreted as third-party trust/recommendation.

### `d` model (replacement identity)

`d` identifies a replaceable event instance (`kind + pubkey + d`).

Because Attestr multiplexes multiple trusted-list types in `30392`, `d` MUST be unique per list instance, not just the subject pubkey.

Recommended `d` formats:

- `trusted-attestors:<kind>`
- `trusted-attestor:<target_pubkey_hex>`

Provider-output `d` formats (lists produced for other users):

- `trusted-attestors:<subject_pubkey_hex>:<kind>`
- `trusted-attestor:<subject_pubkey_hex>:<target_pubkey_hex>`

Clarification:

- List type comes from `t=<type>`.
- `d` answers "which concrete replaceable record is this?"
- If two events share author + kind + `d`, newer replaces older.

Why keep both `t` type tags and `d`:

- `d` is excellent for exact record lookup (`#d` with a known identifier).
- `d` is not suitable for efficient type-bucket discovery (for example, "all trusted-attestor events") because prefix-based `#d` queries are not a portable assumption.
- `t=<type>` gives relay-indexed type filtering (`#t`) for broad discovery queries.
- Therefore, Attestr keeps both: `d` for record identity/replacement and `t` for type-level retrieval.

Provider delegation note:

- Attestr user-authored policy lists are self-authored and do not require subject tags.
- If Trusted Lists Service Providers are used via `10040`, provider outputs should be treated as a separate feed and filtered by trusted provider `authors`.
- Provider outputs SHOULD include the target user via `t=subject:<subject_pubkey_hex>`.
- This allows one provider key to publish trusted lists for many users while keeping filters deterministic.

## 2) Retrieval Queries (Attestr)

All queries below should use hex pubkeys in filters.

## A. Get trusted attestors for a user and assertion kind

```ts
const events = await nostr.query([{
  kinds: [30392],
  authors: [targetUserPubkey],
  '#d': ['trusted-attestors:1'],
  '#t': ['trusted-attestors', 'k:1'],
  limit: 20,
}]);

const attestors = events
  .flatMap((e) => e.tags.filter(([name]) => name === 'p').map(([, pk]) => pk));
```

## B. Get trusted-attestor signals from trusted sources for kind K

```ts
const events = await nostr.query([{
  kinds: [30392],
  authors: trustedSourcePubkeys,
  '#t': ['trusted-attestor', 'k:1'],
  limit: 200,
}]);

const trustedAttestors = events
  .flatMap((e) => e.tags.filter(([name]) => name === 'p').map(([, pk]) => pk));
```

## C. Get an attestor's self-declared proficiency (self-referential trusted-attestor)

```ts
const events = await nostr.query([{
  kinds: [30392],
  authors: [attestorPubkey],
  '#d': [`trusted-attestor:${attestorPubkey}`],
  '#t': ['trusted-attestor'],
  limit: 20,
}]);

const kinds = events
  .filter((e) => e.tags.some(([name, value]) => name === 'p' && value === attestorPubkey))
  .flatMap((e) => e.tags.filter(([name, value]) => name === 't' && value.startsWith('k:')))
  .map(([, value]) => value.slice(2));
```

## D. Get provider-produced trusted attestors for a specific user and kind

```ts
const events = await nostr.query([{
  kinds: [30392],
  authors: trustedProviderPubkeys,
  '#d': [`trusted-attestors:${subjectPubkey}:1`],
  '#t': ['trusted-attestors', `subject:${subjectPubkey}`, 'k:1'],
  limit: 50,
}]);

const trustedAttestors = events
  .flatMap((e) => e.tags.filter(([name]) => name === 'p').map(([, pk]) => pk));
```

## Security requirements

- For personal policy reads, filter by `authors: [currentUserPubkey]`.
- For trusted-attestor ingestion, filter by trusted source authors only.
- Never consume unfiltered public trusted-attestor lists as trusted input.

## 3) Suggested Event Shapes

### Trusted Attestors (policy list)

```json
{
  "kind": 30392,
  "content": "",
  "tags": [
    ["d", "trusted-attestors:1"],
    ["t", "trusted-attestors"],
    ["t", "k:1"],
    ["p", "<attestor1_pubkey_hex>"],
    ["p", "<attestor2_pubkey_hex>"]
  ]
}
```

### Trusted Attestors (provider output for a user)

```json
{
  "kind": 30392,
  "content": "",
  "tags": [
    ["d", "trusted-attestors:<subject_pubkey_hex>:1"],
    ["t", "trusted-attestors"],
    ["t", "subject:<subject_pubkey_hex>"],
    ["t", "k:1"],
    ["p", "<attestor1_pubkey_hex>"],
    ["p", "<attestor2_pubkey_hex>"]
  ]
}
```

### Trusted Attestor (singular trust edge)

```json
{
  "kind": 30392,
  "content": "",
  "tags": [
    ["d", "trusted-attestor:<trusted_attestor_pubkey_hex>"],
    ["t", "trusted-attestor"],
    ["t", "k:1"],
    ["t", "k:30023"],
    ["p", "<trusted_attestor_pubkey_hex>"]
  ]
}
```

### Trusted Attestor (self declaration / proficiency)

```json
{
  "kind": 30392,
  "content": "",
  "tags": [
    ["d", "trusted-attestor:<attestor_pubkey_hex>"],
    ["t", "trusted-attestor"],
    ["t", "k:1"],
    ["t", "k:30023"],
    ["p", "<attestor_pubkey_hex>"]
  ]
}
```

## 4) Migration from Existing Attestr Kinds

Current kinds:
- `31873` Attestor Recommendation
- `31874` Trusted Attestors
- `11871` Attestor Proficiency Declaration

### Mapping table

- `31873` -> `30392` + `t=trusted-attestor`
  - `k` tags -> `t=k:<kind>` tags
  - `p` stays `p`
- `31874` -> `30392` + `t=trusted-attestors`
  - single `k` -> `t=k:<kind>`
  - `p` stays repeatable `p`
- `11871` -> `30392` + `t=trusted-attestor` where `author == p`
  - `k` tags -> `t=k:<kind>`
  - add `p=<author_pubkey_hex>`

Backward-compatible read alias during migration:

- Treat `t=attestor-recommendation` as alias of `t=trusted-attestor`.
- Treat `t=attestor-proficiency` as alias of self-referential `t=trusted-attestor`.

### Rollout plan

1. Dual-write phase
   - Publish both legacy kinds and Trusted List equivalents.
2. Dual-read phase
   - Prefer Trusted Lists when present.
   - Fallback to legacy kinds when missing.
3. Cutover phase
   - Stop writing legacy kinds after client adoption threshold.
4. Legacy deprecation
   - Keep read support for a transition window.

### Conflict handling

- If both legacy and Trusted List data exist, pick newest by `created_at`.
- If timestamps tie, prefer Trusted List variant.
- Deduplicate relation dimensions (`p` and `k`) before computing policy.

## 5) Why this convention

- Keeps one retrieval model for policy, trust edges, and proficiency.
- Uses relay-indexed single-letter tags (`t`, `p`, `d`) for efficient filtering.
- Preserves author provenance and subject scoping.
- Allows transition without breaking existing Attestr behavior.
