# Attestr Phase 1 Implementation Plan
**Tagline:** Notaries on Nostr  
**Tone:** Fun but corporate (8/10)  
**Scope:** Phase 1 only (1a + 1b-prep), no marketplace mechanics yet.

## 1) Product Goals (Phase 1)

### Phase 1a (Ship Gate)
Users can:
1. Search for assertion events (author NIP-05/npub, content, event kind)
2. Select exactly one assertion event
3. Publish an attestation event linked to that assertion
4. See attestations in a newest-first feed
5. Open attestation detail view with comments + zaps
6. Update lifecycle state (including revoke) from detail panel

### Phase 1b (Infra Readiness)
- Keep relay behavior aligned with existing MKStack guidance
- Prepare clean config points for adding dedicated relay later
- No custom relay rollout in this phase

---

## 2) Confirmed Functional Decisions

- Search supports any event kind by default, with optional kind filter
- Search UX: single search input + filters
- Search matching: both exact phrase and broad keyword style
- Search scope default: last 30 days, with selectable other windows
- Use practical subset inspired by ants (not full grammar)
- One attestation links to exactly one assertion event
- Raw assertion entry supports: note1, nevent1, naddr1, and hex id
- No pasted raw event JSON support
- Publish fields follow Attestation NIP minimums, plus:
  - duration support
  - note/comment content
- d tag is auto-generated
- s status is required in UI and uses exact spec list
- v (valid/invalid) shown distinctly from s lifecycle state
- Feed sorted newest first
- Card summary includes: attestor, assertion preview, status, validity, created time, comment count, zap count
- Comments and zaps appear in detail panel
- Comments open to anyone; login needed to publish
- Zaps are social-only in Phase 1
- External assertion links:
  - kind 1 -> jumble.social
  - fallback -> njump.me
  - mapping is code-configurable
- All read views are public; no auth-gated viewing

---

## 3) Information Architecture

## Home (`/`)
- Hero: explain assertion vs attestation
- Brand-forward "Notaries on Nostr"
- 60/40 split:
  - 60% storytelling + explainer
  - 40% immediate search/attest CTA module
- How it works section (3 steps)
- Live attestation feed preview section

## Workspace (same page sections or dedicated route)
- Search and assertion selection
- Publish attestation form
- Attestation feed

## Detail Panel (opened from feed card)
- Full attestation metadata
- Linked assertion details + external viewer link
- Lifecycle actions (owner only)
- Comments thread
- Zap interaction

---

## 4) Data and Event Model (Phase 1)

### Core kind support
- Attestation: kind 31871 (addressable)

### Required/managed tags (per NIP-aligned implementation)
- d (auto-generated unique identifier)
- Exactly one assertion reference:
  - e (event id) OR
  - a (addressable pointer) OR
  - p (pubkey assertion)
- s lifecycle state (required by product UI)
- v validity claim where applicable (valid / invalid)
- Optional validity window:
  - valid_from
  - valid_to
- Optional expiration (if set by publish policy)
- Optional content note/comment

### Lifecycle actions
- Publish new event version under same d to transition state
- Include revoke flow
- Keep state/value distinction visible in UI (s vs v)

---

## 5) Search Strategy (Phase 1 Practical Subset)

## Inputs
- Freeform query
- Author filter (NIP-05/npub/hex)
- Content filter
- Kind filter
- Has-attestations-only toggle
- Time window (default 30d)

## Behavior
- Resolve NIP-05 to pubkey where possible
- For direct NIP-19 identifiers, resolve directly
- For content searches, use broad match approach inspired by ants practical subset
- Keep query count efficient and bounded
- Return assertion candidates suitable for single selection

---

## 6) UI Components to Build

1. HeroExplainer
   - Assertion vs attestation definitions
   - Notaries on Nostr narrative
2. AssertionSearchPanel
   - single input + filter controls + results table/list
3. AssertionSelector
   - single-select behavior
4. AttestationPublishForm
   - status controls
   - validity (from/to or from+duration modes)
   - optional note
5. AttestationFeed
   - newest-first cards with summary fields
6. AttestationDetailPanel
   - metadata + linked assertion + owner lifecycle actions + comments + zaps
7. ViewerResolver
   - kind-specific outbound URL mapping
   - fallback to njump.me

---

## 7) Milestone Breakdown

## Milestone A - Foundation + IA
- Replace placeholder index with branded home/app layout
- Add hero + how it works + CTA + feed section skeletons
- Implement visual language (fun/corporate)
- Exit criteria: homepage communicates product and routes users into action

## Milestone B - Search and Assertion Selection
- Build search input + practical filters + 30-day default
- Implement author/content/kind matching
- Add direct identifier input support (note1, nevent1, naddr1, hex)
- Enforce single assertion selection
- Exit criteria: user can reliably find and choose one assertion event

## Milestone C - Publish Attestation
- Implement spec-aligned publish form
- Auto-generate d
- Require s; support v, validity windows, duration mode, note
- Publish and optimistic refresh into feed
- Exit criteria: published attestation appears and resolves correctly

## Milestone D - Feed and Detail Experience
- Newest-first attestation feed cards
- Summary fields + counts
- Detail panel with full metadata and linked assertion rendering
- External viewer links with resolver mapping
- Exit criteria: browsing flow complete for attestors and observers

## Milestone E - Comments, Zaps, Lifecycle Actions
- Integrate comment thread in detail panel
- Zap action + count summary
- Owner-only lifecycle action controls in detail panel
- Exit criteria: full social/lifecycle interaction complete

## Milestone F - Phase 1b Readiness
- Refactor relay usage boundaries to simplify future dedicated relay insertion
- Ensure config-first extension points for relay additions
- Exit criteria: custom relay can be introduced later with minimal code churn

---

## 8) Acceptance Criteria (Phase 1a Ship Gate)

1. User searches assertion events by author/content/kind
2. User selects one assertion event
3. User publishes attestation with status and optional validity + note
4. New attestation appears first in feed with expected summary metadata
5. Detail panel shows assertion link, metadata, comments, zaps
6. Owner can update state/revoke in detail panel
7. Observer can browse all views without login
8. Kind 1 assertion links open via jumble.social, unknown kinds via njump.me

---

## 9) Non-Goals (Explicitly Deferred)

- Marketplace request/accept/payment economics
- Graperank/WoT scoring integration
- Full ants grammar and advanced discovery operators
- Custom relay launch and production cutover
- Multi-assertion attestations

---

## 10) Risks and Mitigations

- Search variability across relays
  - Mitigate with practical subset + explicit filters + bounded time windows
- Spec drift / tag interpretation issues
  - Centralize attestation tag parsing/validation helpers
- Feed noise and usability
  - Keep summary compact and move deep controls to detail panel
- Viewer fragmentation by kind
  - Use configurable resolver map + sane fallback (njump.me)

---

## 11) Implementation Order (Execution)

1. Milestone A (layout + brand + IA)
2. Milestone B (search + selection)
3. Milestone C (publish flow)
4. Milestone D (feed + detail)
5. Milestone E (comments/zaps/lifecycle)
6. Milestone F (relay readiness polish)
7. Final validation + ship gate test run
