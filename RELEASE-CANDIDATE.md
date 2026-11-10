# Consolidated private beta — 10 November 2026

This branch is the single release candidate against main. It contains the cumulative living-network, collaboration, verified cloud access, owner-controlled agent, opt-in public discovery, brand, and workspace improvements through #58, plus main's free-membership update and the separate Sheets security branch #9.

## Consolidation decisions

- All 48 open PR heads other than #45 are ancestors of this candidate. Their commits remain preserved; no branches are deleted. They are superseded by the consolidated PR rather than individually deployed.
- #45 (shared JIDOKA newsletter signup) remains separate and draft: it depends on a different repository's newsletter release and is unrelated to collaboration notifications.
- Resolved main conflicts by keeping the approved living-network homepage, retaining free profile/add-on wording, and removing the old device-only waitlist collector. The archived vision page now links to the actual beta request route.
- Included #9's explicit anonymous Sheets route/field boundaries, formula safeguards and isolated Google verification harness. Kept current branding and progressive forms during conflict resolution. No live Apps Script deployment or endpoint update occurred. Isolated Google execution remains pending.
- No GitHub Actions deployment workflow is present. Historical Netlify PR preview comments indicate connected hosting; main is not merged during consolidation so the unverified candidate cannot trigger a main deployment.

## Validation and release gates

- 460 automated tests pass after integration, including actual shared-service HTTP tests with isolated test identities; these are not live Supabase account checks.
- 66 HTML pages pass local references, anchors and unique-ID checks. Real/fictional workspace controllers are identical. Diff whitespace check passes.
- GitHub review-thread queries for the 49 open PRs returned no threads. Metadata and dependency ancestry were checked. This is not independent human security approval.
- Desktop/mobile visual walkthrough and real founder/builder two-account journey must be completed against this candidate before main merge. Browser access is checked separately; test substitutions do not satisfy this gate.
- Production Supabase, Auth redirects, Resend, Sheets and Sites version54 remain unchanged. No migrations, emails, permission grants or paid services were triggered.

## Opt-in notifications: next feature after walkthrough

Default off; collaboration updates only, separate from marketing. Owner-authenticated preferences, explicit verified-email consent, immediate disable, generic email copy without idea/task/message content, a trusted workspace link, bounded delivery, idempotent outbox and unsubscribe handling. No automatic subscription or live sends while building. Implement and validate behind a disabled delivery gate after walkthrough validation.
