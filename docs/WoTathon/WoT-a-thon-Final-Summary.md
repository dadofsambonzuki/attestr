# Attestr -- Notaries on Nostr

## The Problem

Credentials are traditionally issued by centralised, trusted authorities. Nostr's cryptographically signed, self-publishing model can invert this power structure - enabling "first-person" credentials issued by sovereign individuals and recognised (or not) by others.

However, Nostr lacked standardised infrastructure for making, tracking, and revoking truthfulness claims about events. Without this primitive, trust signals were ad-hoc and non-interoperable, verification expertise could not be discovered or monetised, and critical use cases had no unified framework.

Attestations fix this.

## What We Built

**Attestr** is an attestation marketplace for Nostr. It enables anyone to become a "pleb oracle" by creating a platform where users can discover specialised attestors to verify their events, identities, and claims - while attestors build reputation and monetise their verification expertise across kind-specific webs-of-trust.

- [Short explainer video](https://www.loom.com/share/916847795763432d876230613ac7368b) and [the slides used](https://docs.google.com/presentation/d/1cEhujb3PU5X1-V236r4H1NcUG3gZEYvHeZPs-1PqRRc/edit?usp=sharing)
- [Short product demo video](https://www.loom.com/share/a6d3b904ccdd425f8bb6326e4383c63e)

Live now at [attestr.xyz](https://attestr.xyz) running [this code](https://github.com/dadofsambonzuki/attestr).

### Attestation NIP

The [Updated Attestation NIP](https://github.com/dadofsambonzuki/attestr/blob/7de4800b3473afe6885c9e8930e2b954f27660fd/docs/attestation-nip.md) defines four core event kinds, with Trusted Lists (kind 30392) variants for attestor trust and proficiency:

**Core Kinds:**

- **Attestation** (kind 31871) -- Lifecycle status (verifying, valid, invalid, revoked), validity windows, expiration, and assertion references via `e`/`a` tags.
- **Attestation Request** (kind 31872) -- Solicits verification from specific attestors, with optional Cashu token payment locking.

**Attestor Trust & Proficiency** (current form uses kind 30392 Trusted Lists; legacy kinds dual-written for backward compatibility):

- **Trusted Attestor / Attestor Recommendation** (kind 30392 `t=trusted-attestor` / kind 31873) -- Recommends a specific attestor for given assertion kinds. Single `p` tag for the attestor, `t=k:<kind>` tags for assertion kinds.
- **Trusted Attestors List** (kind 30392 `t=trusted-attestors` / kind 31874) -- A curated set of trusted attestors for a given assertion kind. `t=k:<kind>` tag for the assertion kind, repeatable `p` tags.
- **Proficiency Declaration** (kind 30392 self `t=trusted-attestor` / kind 11871) -- An attestor's self-declared verification capabilities, where author == `p`. `t=k:<kind>` tags for attestable kinds.

Use of Trusted Lists enables us to have just 2 core kinds, with 30392 being used to replace 3 of the original kinds in the Attestation NIP.

Implementing clients: **Attestr**, **Amethyst**, **Nostria**, **WalletScrutiny**.

### Attestation Trust Models

WoT is commonly applied between npubs on Nostr. Attestations extend this to a contextual WoT for all notes of all kinds. Four trust model layers were identified:

1. **Self-declared Lists** (31873 / 30392) -- "Here is a list of attestors I trust for verifying these kinds." Users curate trusted attestor lists directly.
2. **Delegated Lists** (NIP-85 kind 10040) -- "I trust these npubs to decide who I should trust for given kinds." Users delegate trust resolution to service providers.
3. **Decentralised Lists (kind 9998/9 + 3998/9)** -- Trust determined from the user's broader WoT graph.
4. **Calculated Attestation Score** -- A Trusted Provider computes personalised attestation scores based on the user's WoT.

The first two models are fully implemented with a migration path from NIP-specific kinds to standardised Trusted Lists (kinds 30392-30395), using dual-write and dual-read strategies for backward compatibility. The later two are on the attestr roadmap.

### Application Features

**Attestation Publisher & Viewer** -- Publish attestations about any Nostr event with full lifecycle management. Search and filter attestations by content, attestor, status, assertion kind, and time window. Attestors can update lifecycle status and edit validity windows on their own attestations.

**Attestation Marketplace** -- Browse open attestation requests ranked by match against the viewer's declared proficiency. Create targeted requests specifying preferred attestors. DM requestors directly from request detail pages.

**Attestor Discovery & Trust** -- Rich profile pages showing attestations made/received, proficiency declarations, trusted attestor lists (direct and delegated), incoming recommendations, and cross-client links. Trusted attestors display a trust badge with source tooltip.

**NIP-85 Provider Delegation** -- Support for kind 10040 trusted service provider delegations scoped by list kind and assertion kind. Trust resolution combines direct lists with provider-delegated lists, with subject-specific override support.

**Integrated Nostr Protocols** -- NIP-22 threaded comments on attestations and assertions. NIP-57 zaps with three payment methods (NWC, WebLN, QR fallback) and per-attestation zap stats. NIP-09 event deletion. NIP-17 direct messaging. NIP-19 universal routing. NIP-65 relay management.

**Developer Documentation** -- Dedicated /developers page with code examples for all event kinds, tag structures, and query patterns. Full protocol documentation in the repository.

### Application Roadmap

**Additional Trust Models** -- WoT-ranked Decentralised Lists and Calculated Attestation Scores with attestr as a Trusted Provider.

**Gamma Marketplace** -- Explore NIP-99 for better commerce support to power the Attestation Marketplace.

## Why attestr?

Every Nostr event is an assertion. Every assertion can be attested. Every attestation can be zapped.

Attestors build reputation in specific domains, and trust becomes composable, portable and sovereign.

Attestations are the temporal counterpart to delegation: where delegation authorises action before the fact, attestations verify claims after the fact.

Signed JSON. Trusted npubs. Attested events.

Together, these help form a set of trust primitives for the sovereign internet.

