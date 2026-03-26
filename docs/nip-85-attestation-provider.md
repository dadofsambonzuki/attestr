# Attestr as a NIP-85 Trusted Assertion Provider

Status: Draft implementation note

## Goal

Attestr can operate as a NIP-85 provider that publishes event validity scores so clients do not need to run trust graph calculations on-device.

This can be powered by Graperank (or a Graperank-like Web of Trust algorithm) using:
- Attestation events (`31871`)
- Attestor recommendations (`31873`)
- Trusted attestor sets (`31874`)
- Wider social/network trust signals

## NIP-85 Subject Coverage

NIP-85 is not limited to pubkeys. It supports scoring for:

- `30382` - pubkey subject (`d = <pubkey>`)
- `30383` - regular event subject (`d = <event_id>`)
- `30384` - addressable event subject (`d = <kind:pubkey:d>`)
- `30385` - NIP-73 subject (`d = <i-tag>`)

For attestation validity of assertions, Attestr should primarily publish:

- `30383` for regular assertion events
- `30384` for addressable assertion events

## Output Tags

### Interoperable baseline

Use NIP-85 standard tag:

- `rank` (integer, normalized `0-100`)

### Optional Attestr-specific extensions

To provide stronger semantics for validity, Attestr may also include non-standard tags, for example:

- `attestation_score` (e.g. `0.00-1.00`)
- `confidence` (model confidence)
- `model` (algorithm name)
- `version` (algorithm version)

Clients that only support baseline NIP-85 can still use `rank`.

## Trust Delegation Model

Users delegate trust to providers with NIP-85 `kind:10040`.

Important: `10040` delegates trust to provider keys, not directly to attestor pubkeys.

So the flow is:

1. User publishes `10040` trusting Attestr provider key(s) for desired metrics (e.g. `30383:rank`, `30384:rank`).
2. Attestr publishes trusted assertion results.
3. Client consumes only results authored by trusted provider keys.

### Delegation scope details

NIP-85 delegation is scoped by `kind:tag` entries in `10040` (for example `30383:rank` and `30384:rank`).

This means delegation is generally by NIP-85 subject type, not directly by base assertion kind (for example kind `1` only).

If Attestr applies kind-specific trust logic (recommended), that scope is expressed in the provider algorithm and output metadata, not in base `10040` syntax.

## Personalized vs global scoring

Validity scores can be either:

- global (same result for all users), or
- personalized (result depends on a specific user's trust graph)

When scores are personalized, providers should use distinct service keys per personalized view so clients can explicitly delegate to the intended perspective.

## Example: Event validity score (regular event)

```json
{
  "kind": 30383,
  "content": "",
  "tags": [
    ["d", "9f7f7f7c0d2b6c6fb1f2f9c3f0a26a8b845ecb19bb26b2df14b6c3d5f0b0aa12"],
    ["rank", "87"],
    ["k", "1"],
    ["attestation_score", "0.91"],
    ["confidence", "0.82"],
    ["model", "graperank-attestr"],
    ["version", "2026-03-26"]
  ]
}
```

## Example: Event validity score (addressable assertion)

```json
{
  "kind": 30384,
  "content": "",
  "tags": [
    ["d", "31871:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:claim-123"],
    ["rank", "92"],
    ["k", "30023"],
    ["attestation_score", "0.95"],
    ["confidence", "0.88"],
    ["model", "graperank-attestr"],
    ["version", "2026-03-26"]
  ]
}
```

## Practical Client Policy

Recommended evaluation order:

1. Apply hard user policy (blocklist/allowlist if present).
2. Load trusted provider keys from `10040`.
3. Read NIP-85 assertions from those authors only.
4. Use `rank` as base interoperability score.
5. Optionally refine using Attestr-specific tags (`attestation_score`, `confidence`).

## Security Notes

- Always filter by `authors` when querying trusted assertion results.
- Treat untrusted provider outputs as unverified data.
- Keep algorithm metadata (`model`, `version`) explicit to support comparability and audits.
