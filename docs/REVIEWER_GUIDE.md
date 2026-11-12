# Reviewer guide

This guide helps public readers and application reviewers inspect Founders & Builders without production credentials. It can support an Alignerr application; it claims no affiliation, endorsement, employment, or certification.

## Product judgment

Founders need direction and practical help; builders need accessible contributions, relationships, and honest evidence of work. A directory alone does not resolve the handoff. The product evolved toward discovery → interest → agreement → delivery → feedback → separately approved credit.

Start with the [README](../README.md), [roadmap](../ROADMAP.md), and [fictional tour](https://founders-builders-ux-review.hello978822.chatgpt.site/quick-tour.html). Fictional examples are not testimonials or adoption evidence.

## Review path

1. Use the fictional tour for the user journey; it requires no production account.
2. Read the [engineering guide](ENGINEERING_GUIDE.md) for the repository map and trust boundaries.
3. Inspect the tests and implementation below, then compare dated release records.
4. Review the [public Project](https://github.com/users/tdong1919-dev/projects/4) and [exposure findings](PUBLIC_EXPOSURE_REVIEW_20261112.md). Open acceptance criteria are not completed work.

The repository and Project were independently accessible without sign-in on November 12, 2026. The existing folders are documented rather than moved, preserving deployed paths and unrelated work.

## Evidence to inspect

| Area | Source/evidence | Evaluation question |
| --- | --- | --- |
| State transitions | [collaboration core](../collaboration-core.js), [tests](../tests/shared-collaboration.test.cjs) | Are actions role-appropriate, versioned, and explicit? |
| Private cloud boundary | [Edge entry](../supabase/functions/fb-collaboration/index.ts), [handler tests](../tests/cloud-handler.test.cjs), [migrations](../supabase/migrations/) | Are identity, approval, ownership, and private/public separation enforced server-side? |
| Agent authority | [onboarding](../AGENT-ONBOARDING.md), [MCP tests](../tests/agent-mcp.test.cjs), [A2A tests](../tests/a2a-pilot.test.cjs) | Can an agent exceed scope, action, expiry, or request limits? What happens after revocation? |
| Evidence and uncertainty | [discovery/learning](../DISCOVERY-AND-LEARNING.md), [learning tests](../tests/learning-insights.test.cjs) | Do suggestions identify their basis and avoid unsupported capability/causal claims? |
| Compensation and credit | [paid terms tests](../tests/paid-terms.test.cjs), [record tests](../tests/contribution-record.test.cjs) | Is completion distinguished from verified payment and approved public credit? |
| Human experience | [next-step design](MY_NEXT_STEP.md), [navigation tests](../tests/navigation.test.cjs), [journey tests](../tests/journey-concept.test.cjs) | Can each person understand the next action, waiting state, and example limitations? |
| Release discipline | [stack inventory](../PR-STACK-INVENTORY.md), [release record](../BETA-RELEASE-20261110.md), [PR #67](https://github.com/tdong1919-dev/founders-builders/pull/67) | Can implementation, testing, merge, deployment, and remaining limits be traced? |

## AI-related work demonstrated

- Task-scoped delegation and human approval boundaries rather than unlimited authority from vague intent.
- Evaluation of isolation, revoked permissions, stale responses, malformed input, retries, and unsupported protocols.
- Untrusted participant content and separation of public discovery from private access.
- Evidence-based explanations, missing-data handling, and avoiding fabricated users/results.
- Narrow interoperability claims and a distinction between protocol fixtures and real-host acceptance.

Matching and current private learning suggestions use structured/rule-based evidence. This is not evidence of foundation-model training or a self-improving autonomous workforce. Broader orchestration experiments include explicitly fictional sandboxes.

## Authorship and development

Crystal leads product direction, experience requirements, and acceptance decisions. Development has been assisted by AI coding agents, including Codex, through iterative implementation, review, tests, and owner-led checks. Git history/PRs provide the trail; this guide does not attribute every line to unaided human authorship.

Useful discussion topics include how privacy shaped the architecture, how mobile feedback simplified the UX, why protocol claims are limited, and why test evidence is different from market proof.

## Validation limits

The November 10 release record reports 470 automated tests and ten live anonymous/forged-token boundary checks. PR #67 reports 507 regression tests and live public-discovery responses. These are dated reports, not numbers guaranteed for every checkout or a claim this documentation change repeated production checks.

[Open PR #63](https://github.com/tdong1919-dev/founders-builders/pull/63) records a synthetic journey using two real accounts, mobile emulation, support/deletion drills, and application recovery. It remains unmerged at this review. Emulation is not physical-device certification; application recovery is not a complete managed-provider backup.

No unrestricted launch, independent penetration test, external-host certification, verified user income, customer traction, or public case-study consent is claimed.
