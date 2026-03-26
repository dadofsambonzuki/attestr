# Attestation NIP Update Notes

Status: Draft update plan

This document captures protocol updates to apply around attestor recommendation and trusted-attestor policy events.

## Decision: Keep Both `31873` and `31874`

It makes sense to keep both kinds because they serve different layers:

- `31873` (Attestor Recommendation) captures recommendation edges and provenance.
- `31874` (Trusted Attestors) captures explicit, materialized trust policy per assertion kind.

Using both enables:

- social discovery and recommendation flow (`31873`)
- portable, low-cost trust resolution at runtime (`31874`)
- optional auto-generation of `31874` from trusted `31873` sources

## Kind Definitions

### `31873` - Attestor Recommendation (addressable)

Purpose: "I recommend this attestor for these assertion kinds."

Required tag shape:

- exactly one `p` tag (recommended attestor)
- one or more `k` tags (assertion kinds)

Recommended tag shape:

- `d` as the addressable identifier for this recommendation record

Example:

```json
{
  "kind": 31873,
  "content": "",
  "tags": [
    ["d", "attestor:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["p", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["k", "1"],
    ["k", "30023"]
  ]
}
```

### `31874` - Trusted Attestors (addressable)

Purpose: "For assertion kind K, these are my trusted attestors."

Required tag shape:

- exactly one `k` tag (assertion kind scope)
- one or more `p` tags (trusted attestors)

Recommended tag shape:

- `d` as `trusted-attestors:<kind>`

Example:

```json
{
  "kind": 31874,
  "content": "",
  "tags": [
    ["d", "trusted-attestors:1"],
    ["k", "1"],
    ["p", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["p", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ["p", "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"]
  ]
}
```

## Resolution Model

Recommended trust resolution precedence:

1. Explicit `31874` policy (manual user-curated list)
2. Auto-generated `31874` policy (from trusted recommendation sources)
3. Raw `31873` recommendations only when no `31874` is present

## Query and Security Notes

- For user policy (`31874`), query with `authors: [<current_user_pubkey>]`.
- For recommendation ingestion (`31873`), restrict `authors` to trusted recommenders/providers.
- Do not accept unfiltered public recommendation events as trusted policy input.

## Policy Layer vs Scoring Layer

`31873` and `31874` are trust-policy primitives, while NIP-85 events are trust-score outputs.

### `31873` / `31874` (Trusted Attestor policy)

These events express who is trusted for what.

- `31873` (`p`-focused): recommendation edge.
  "I recommend attestor `p` for assertion kinds `k...`."
- `31874` (`k`-focused): materialized trust set.
  "For assertion kind `k`, my trusted attestors are `p...`."

This layer is explicit, user-readable, and useful for portability, auditing, and policy overrides.

### NIP-85 Trusted Assertions (computed output)

These events express what score a trusted provider computed.

- Provider publishes `30383`/`30384` (or other NIP-85 kinds) with `rank` and optional score metadata.
- User trust is delegated via `10040` to provider keys.
- Output is quantitative and optimized for lightweight client consumption.

Delegation nuance:

- `10040` entries are `kind:tag` scoped (for example `30383:rank`, `30384:rank`), which is broad by NIP-85 subject type.
- Base assertion-kind specificity (for example "kind 1 only") is handled in provider calculation logic and optional output metadata (for example a `k` scope tag), not in base NIP-85 delegation syntax.

### Relationship between them

They are complementary, not redundant:

1. Use `31873`/`31874` as policy inputs and trust graph structure.
2. Provider computes validity/trust scores from those inputs (plus network signals).
3. Publish resulting scores via NIP-85 for client use without heavy on-device computation.

### Practical rule of thumb

- Need transparent trust policy? Use `31873`/`31874`.
- Need fast, consumable per-event trust scores? Use NIP-85.
- Best architecture: maintain both layers.

## Scoring Scope Clarification

Attestr validity scores may be personalized per npub (based on that user's trust graph) or global.

- Personalized mode: score for the same assertion can differ across users.
- Global mode: score is shared across users.

For personalized scoring, use separate provider keys per personalized perspective so user delegation remains explicit in `10040`.
