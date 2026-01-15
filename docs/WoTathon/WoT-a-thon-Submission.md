# Attestr - Notaries on Nostr
## Elevator Pitch
Attestr is an attestations marketplace for Nostr.  It enables anyone to become a "pleb oracle" by creating a decentralised marketplace where attestees can discover specialised attestors to verify their events, identities, and claims; while attestors build reputation and monetize their verification expertise across kind-specific webs of trust.

## Problem & Solution

### The Problem

Nostr lacks standardised infrastructure for making, tracking, and revoking truthfulness claims about events. Without this primitive, trust signals are ad-hoc and non-interoperable, verification expertise cannot be discovered or monetised, and critical use cases like identity verification, software releases, and location proofs lack a unified framework that scales across Nostr.

### The Solution
Attestr will provide a complete attestations marketplace built on the [Attestation NIP](https://nostrhub.io/naddr1qvzqqqrcvypzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qy28wumn8ghj7un9d3shjtnyv9kh2uewd9hsqrrpw36x2um5v96xjmmwwvuhdk8z). Phase 1 will enables the publishing and surfaces of the basic attestations kinds with a dedicated relay. Phase 2 will build out a marketplace to connect attestees with specialised attestors, incorporate GrapeRank and other reputation markers, and enable payment flows.

## Current State

We currently have:

 - The Attestation NIP - A protocol specification defining attestation events, requests, recommendations, and proficiency declarations with lifecycle management and payment integration.  [Attestation NIP](https://nostrhub.io/naddr1qvzqqqrcvypzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qy28wumn8ghj7un9d3shjtnyv9kh2uewd9hsqrrpw36x2um5v96xjmmwwvuhdk8z). 

 - meatspacestr.io Proof-of-Concept - A working prototype demonstrating proof-of-place attestations. Live at [meatspacestr.io](meatspacestr.io).

Each of which are prior art wrt this WoTathon.

**The build-out of the attestr service is the focus of this WoTathon.**

## Roadmap & Future Scope

### Phase 1: Attestation Viewer & Publisher
- [ ] Dedicated relay setup (relay.attestr.xyz)
- [ ] Publish attestations about any other Nostr event
- [ ] View and filter attestations by subject kind, attestor, validity status
- [ ] NIP-22 comments and NIP-57 zaps on attestation events

### Phase 2: Attestations Marketplace
- [ ] Request attestations from specific attestors
- [ ] Discover attestors by proficiency declarations and recommendations
- [ ] Integration with verification service providers (meatspacestr, proof-of-person, NIP-39 social proofs)
- [ ] Payment flows & marketplace economics