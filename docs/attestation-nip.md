# Attestation NIP Reference

Source: `https://nostrhub.io/naddr1qvzqqqrcvypzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qyfhwumn8ghj7un9d3shjtnyv9ujuct89uqqcct5w3jhxarpw35k7mnnaawl4h`

This file is a local context reference for Attestr development.

## Event Kinds

- `31871` - Attestation (addressable)
- `31872` - Attestation Request (addressable)
- `31873` - Attestor Recommendation (addressable)
- `11871` - Attestor Proficiency Declaration (replaceable)

## Core Tag Requirements

## `31871` Attestation

- Required: `d`
- Required: exactly one assertion reference from `e` or `a` or `p`
- Optional: `s` (`accepted`, `rejected`, `verifying`, `verified`, `revoked`)
- Conditional: `v` (`valid` or `invalid`) when `s=verified`
- Optional: `valid_from`, `valid_to`, `expiration`, `request`

## `31872` Attestation Request

- Required: `d`
- Required: exactly one assertion reference from `e` or `a` or `p`
- Optional: one or more `p` tags (requested attestors)
- Optional: `cashu_token`

## `31873` Attestor Recommendation

- Required: `d` (recommended attestor identifier)
- Required: one or more `k` tags (kinds)
- Optional: `desc`

## `11871` Proficiency Declaration

- Required: `p` (declaring attestor pubkey)
- Required: one or more `k` tags (kinds)
- Optional: `desc`

## Notes

- Use `31871` for attestation lifecycle state and validity windows.
- Use `31872` for explicit request workflows.
- Use `31873` and `11871` together for attestor discovery and capability signaling.
- For the authoritative version, consult the source URL above.
