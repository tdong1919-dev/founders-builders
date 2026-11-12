# Founders & Builders roadmap

**Nothing great is ever built overnight. Or alone.**

Our mission is to turn ideas and skills into useful work, lasting relationships, and an honest contribution history. People can participate directly or bring an agent acting within explicit permissions.

**Updated:** November 12, 2026. **Application baseline:** `ff27c96`; documentation PR [#69](https://github.com/tdong1919-dev/founders-builders/pull/69) is merged. [Public Project](https://github.com/users/tdong1919-dev/projects/4). This is a checkpoint-based roadmap, not a promise of delivery dates. “Built” means included in that baseline. Recorded verification is dated evidence, not a fresh production test today.

## Delivered — how we reached this point

| Period | Milestone | Evidence and qualification |
| --- | --- | --- |
| August 2026 | Community foundation: directories, search, activity, local identity, and network exploration. | [PR #1](https://github.com/tdong1919-dev/founders-builders/pull/1), [#2](https://github.com/tdong1919-dev/founders-builders/pull/2). Device-local identity was a prototype, not authentication. |
| October 17–21 | Idea-to-execution: project discovery, scoped contributions, founder/builder handoffs, feedback, and credit. | [PR #3](https://github.com/tdong1919-dev/founders-builders/pull/3), [#4](https://github.com/tdong1919-dev/founders-builders/pull/4), [#5](https://github.com/tdong1919-dev/founders-builders/pull/5), [#10](https://github.com/tdong1919-dev/founders-builders/pull/10). Initial local/manual handoffs are superseded by the cloud journey. |
| October 25–29 | Cloud collaboration: verified identities, private progress, agreements, delivery, mutual reviews, invitation/step controls, conversations, and next-action states. | [Cloud activation](CLOUD-ACTIVATION.md), [journey log](PROJECT-JOURNEYS.md). Earlier stacked work later entered main through #59. |
| November 8–9 | Owner control and agent access: scoped MCP, limited A2A owner handoff, onboarding, missions, opt-in discovery, explainable matching, and recorded-evidence learning. | [Agent connection](AGENT-CONNECTION.md), [A2A pilot](A2A-PILOT.md), [PR #39](https://github.com/tdong1919-dev/founders-builders/pull/39), [#40](https://github.com/tdong1919-dev/founders-builders/pull/40), [discovery/learning](DISCOVERY-AND-LEARNING.md). External-host acceptance remains separate. |
| November 9–10 | Distinct living-network branding, immersive homepage, simpler first journey, and consolidated beta release. | [PR #59](https://github.com/tdong1919-dev/founders-builders/pull/59), [stack inventory](PR-STACK-INVENTORY.md), [release record](BETA-RELEASE-20261110.md). Superseded PRs were not individually merged; the inventory records inclusion. |
| November 10–11 | Approval-based launch controls, explicit paid terms, contribution records, agent readiness, founder guidance, and recovery tooling. | [PR #60](https://github.com/tdong1919-dev/founders-builders/pull/60), [#61](https://github.com/tdong1919-dev/founders-builders/pull/61), [#62](https://github.com/tdong1919-dev/founders-builders/pull/62). Later operational evidence in [#63](https://github.com/tdong1919-dev/founders-builders/pull/63) remains unmerged at this review. |
| November 11 | Cleaner mobile navigation, consistent Contributions/Builders/Community/Workspace destinations, current guidance, private story drafts, and a hosted discovery fix. | [PR #64](https://github.com/tdong1919-dev/founders-builders/pull/64), [#65](https://github.com/tdong1919-dev/founders-builders/pull/65), [#66](https://github.com/tdong1919-dev/founders-builders/pull/66), [#67](https://github.com/tdong1919-dev/founders-builders/pull/67). Truthful empty discovery states are not evidence of a populated marketplace. |

## Next — readiness and real participation

### 1. A clear, reviewable public project

**Goal:** a visitor or application reviewer can understand the mission, try a safe example, and distinguish built work from aspirations.

- [x] Documentation PR [#69](https://github.com/tdong1919-dev/founders-builders/pull/69) merged on November 12, 2026; claims and linked evidence reviewed. This is documentation acceptance, not a new production release.
- [ ] Review operational evidence [#63](https://github.com/tdong1919-dev/founders-builders/pull/63) and mobile text fix [#68](https://github.com/tdong1919-dev/founders-builders/pull/68), reconciling source and deployed revisions.
- [ ] Complete the [public exposure checklist](docs/PUBLIC_REPOSITORY_READINESS.md), including full history, metadata, fixtures, screenshots, and licensing.
- [ ] Choose a source license or explicitly retain source-available/all-rights-reserved terms. Public visibility is distinct from open-source licensing.
- [x] Confirm existing repository and Project visibility: both are already public; anonymous read access verified November 12, 2026. No visibility or backend-access change was made.
- [ ] Resolve the remaining historical personal-contact review and record the licensing decision in the [exposure review](docs/PUBLIC_EXPOSURE_REVIEW_20261112.md). History rewriting requires a separate owner-approved cleanup plan.

**Exit evidence:** reviewed docs on main, a recorded exposure review, clear license position, and intentional exposure decision with unresolved findings visible. Existing public visibility is not a completed privacy sign-off. A custom domain can follow with separate Auth/origin/SEO checks.

### 2. A small community completing real work

**Goal:** validate usefulness with founders and builders, rather than equating signups with success.

- [ ] Recruit an initial target of five founders and fifteen builders. These are goals, not claimed users or available positions.
- [ ] Publish owner-approved, genuinely available opportunities across development, research, design, writing, marketing, automation, and operations as supply allows.
- [ ] Keep outcome, skills, time, support, Paid/Voluntary status, and one next action understandable on a phone.
- [ ] Run a small monthly in-person networking/building event once venue, capacity, and date are confirmed. Agents are optional.
- [ ] Record participant usefulness and reasons for stalled or abandoned handoffs.
- [ ] Publish real contribution stories only after both participants separately approve the exact public content; portfolio permission alone is insufficient.

**Exit evidence:** completed real journeys, participant feedback, and a prioritized friction list. Synthetic drills and fictional examples are excluded from adoption metrics and testimonials.

### 3. Trustworthy beta operations

**Goal:** keep approval-based participation supportable, private, and affordable.

- [ ] Recheck hosted desktop/mobile and two-account journeys after material changes; retain dated prior evidence without implying perpetual coverage.
- [ ] Maintain support/report triage, deletion handling, recovery drills, incident/rollback instructions, and free-tier usage review.
- [ ] Keep collaboration emails off until explicit opt-in, generic content, delivery, unsubscribe, retries, and caps pass a consented test.
- [ ] Keep Sheets submissions off until isolated Google and reviewed live deployment checks pass; retirement is also an option.
- [ ] Review access approval, quotas, blocking, report handling, and operating capacity before unrestricted signup.

**Exit evidence:** current checks and assigned responsibilities. No paid service is required by this checkpoint; upgrades need a separate decision.

## Planned — bounded interoperability and ecosystem learning

### 4. Prove real external-agent interoperability

**Goal:** demonstrate owner-authorized access from a real host, including JIDOKA EA where compatible.

- [ ] Verify external public discovery uses only approved public fields.
- [ ] Complete a read-only task-scoped MCP handshake from a host supporting the adapter's authentication and transport.
- [ ] Test unauthorized actions/tasks, expiry, budget exhaustion, and immediate revocation from that host.
- [ ] Complete the limited A2A owner-question → owner-response → poll/cancel loop with disposable synthetic content.
- [ ] Publish a dated host/protocol compatibility matrix with methods, limitations, and reproducible evidence.

**Exit evidence:** actual host results. A browser connection test, advertised Agent Card, or HTTP fixture alone cannot close this checkpoint.

### 5. Bounded agent-to-agent collaboration

**Goal:** progress from helping one's own owner toward cross-participant coordination without losing human authority.

- [ ] Define mandates for actions, counterparties, disclosures, scope, budgets, expiry, and escalation.
- [ ] Require both sides' permissions; apply the stricter boundary.
- [ ] Implement durable lifecycle, retries/idempotency, cancellation, revocation, and attributable activity before real delegated actions.
- [ ] Start with reversible discovery and clarification. Separately review applying, accepting terms, executing tools, or publishing work.
- [ ] Explain review-first, bounded delegation, and only later hands-free operation within an explicit mandate.

**Exit evidence:** adversarial multi-owner tests, override/revocation checks, and a real-host pilot. Current missions do not run a background executor. The broader [orchestrator design](docs/ECOSYSTEM_ORCHESTRATOR.md) remains partly a fictional sandbox/design direction.

### 6. A useful ecosystem learning loop

**Goal:** improve from evidence without exposing private work or rewarding activity alone.

- [ ] Separate transport failures, intended policy stops, human decisions, and abandoned handoffs.
- [ ] Report windows, denominators, missing data, completions, feedback, and repeat collaboration.
- [ ] Evaluate suggestions through participant feedback and explicit experiments; do not infer causation from correlation.
- [ ] Require explicit data-use boundaries, de-identification, comparable cohorts, and bias review before cross-participant comparisons.
- [ ] Exclude private transcripts/ideas from general reports and model-training inputs by default.

**Exit evidence:** traceable recommendations with measured usefulness. Current private rule-based guidance is a starting point, not a trained ecosystem intelligence system.

### 7. Explore Web3 portability and sustainable membership

**Goal:** make permissioned evidence and agent authority portable where there is a demonstrated benefit.

- [ ] Investigate portable contribution attestations and interoperable identity/delegation formats, including non-blockchain options.
- [ ] Evaluate selective disclosure, withdrawal, correction, deletion, accessibility, and recovery before immutable publication.
- [ ] Prototype wallets/on-chain integration only for validated needs; keep private ideas and personal data off-chain.
- [ ] Consider membership and clearly labeled sponsored/boosted placements after community value and demand are demonstrated. No price or member threshold is committed.
- [ ] Preserve transparent organic discovery and direct participant compensation; this roadmap plans no platform payment processing or transaction cut.

**Exit evidence:** reviewed use case, prototype, privacy/security assessment, cost model, and owner decision. There is no token launch, cryptocurrency investment proposition, DAO, escrow, wallet requirement, or on-chain reputation system today.

## Measurement and updates

Prefer relevant opportunity → interest → agreement → delivery → feedback → permissioned credit, participant usefulness, and repeat collaboration. Measure waiting time and abandonment with denominators and context. Impressions, signups, message volume, and agent calls are supporting signals.

Propose changes through an issue stating the user problem, evidence, affected journey, and acceptance criteria. Keep implementation, acceptance, merge, and deployment separate. Complete a checkpoint only when its exit evidence is linked. Priorities can change with participant feedback, security findings, and operating capacity.
