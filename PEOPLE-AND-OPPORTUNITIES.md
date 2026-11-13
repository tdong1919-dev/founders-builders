# People, projects, opportunities and portfolio credit

Implemented November 13, 2026 on `feature/people-projects-exchange`. This branch includes the shared header fix from PR #71. Merge status, deployment status and real-account acceptance are separate.

## The journey

In Workspace, **People and opportunities** offers a single profile for founder, builder or both; a three-group opportunity form; separately published project cards; exchange review for older steps; and explicit public portfolio credit.

- Profile groups: bio/role, experience/work links, and time/exchange/working preferences. Credentials and external work are self-reported. Links are validated HTTPS links and are never fetched, scraped or embedded by the platform.
- Opportunity groups: project/goal, one deliverable with scope/support/time/feedback, and proposed exchange. Preview and confirmation are required before creating and publishing a quick opportunity. Public and approved-member scopes are explained in the preview.
- Monetary requires positive amount, supported currency and payment timing. Non-monetary requires “What are you offering in exchange?” Both requires both. Equity is free-text participant-arranged terms, not a platform-defined instrument. Feedback and separately approved credit are standard expectations, not substitutes for compensation.
- Legacy `unpaid` records stay legacy. Owners can review and choose a new explicit exchange. This withdraws the public opportunity pending a fresh review, and does not rewrite already accepted agreements. Revised proposals still invalidate prior acceptance.
- Public profiles at `/people/<public-id>` and projects at `/project/<public-id>` use separately approved snapshots. Opportunity cards link to them only where enabled. Private briefs, conversations, reviews and contacts are excluded. Editing a profile withdraws its prior public snapshot; fresh review is required. Withdrawals take effect on new reads, not copies others already retained.
- Discovery supports keywords, skills, exchange, time, working arrangement, location, experience and newest/oldest/recently updated sorts. Monetary ranges require a currency; no currency conversion or rate equivalence is claimed. New public amounts/explanations come only from the explicit exchange review path. Older public-card clients do not silently expose price details.
- Completed contribution records remain private. The contributor can separately publish only the exact recorded founder-approved credit. No delivery evidence URL or private review is automatically exposed. Revoked permission removes that credit from subsequent public profile reads.
- A drafting brief can be prepared and explicitly copied for an external agent. It does not run an AI service, contact an agent, issue a grant, or publish. Server-side human checks deny agent publication of profiles, projects, opportunities and credit. Existing task grants, limits, acceptance controls and revocation remain in force.

## Infrastructure and compatibility

The existing service-only transactional JSON state gains owner-scoped `publicPeople`, `publicProjects`, and `publicCredits` maps. There are no new tables, raw browser grants, migrations, paid services or changes to approval-based signup. Existing snapshots and historical agreements remain readable. The recovery/deletion drill now removes the additional owner/contribution references.

Only Founders & Builders project `ijvokvffhcvakaultzfk` is the deployment target. The live Edge source at version 12 was compared with repository source before edits and all seven files matched. Keep the existing entrypoint authentication, origins, notification settings and service-only persistence. Collaboration emails and legacy Sheets submissions stay off.

## Validation and acceptance

The full local suite passed 527 tests with loopback HTTP access. Focused tests additionally cover new domain/publication behavior, public rendering/withdrawal, three-group forms, explicit consent, stale previews, sign-out clearing, and exact approved credit. All 67 static pages pass local asset/link/anchor/ID checks. No production participant content was published for testing.

The new two-account domain test uses synthetic founder/builder identities and completes interest → proposal → changed exchange → reconfirmation → delivery → feedback → exact credit permission → recorded credit → both reviews → separate public credit → revocation. Existing HTTP tests exercise independent clients and persistence, not real hosted account sessions.

Fresh rendered desktop/mobile and hosted two-real-account acceptance remain pending if browser access is unavailable. Do not describe them as complete based on local tests. Test these before public promotion:

1. Save a disposable profile as each role; review/publish exact safe credentials/links, then edit and verify withdrawal.
2. Publish a safe project card and each exchange type. Missing non-monetary explanation and invalid paid fields must be rejected.
3. Search/sort, open founder/project/builder cards, return to retained filters, and check a narrow mobile viewport and keyboard menu.
4. Apply from the second account, change terms, confirm again, deliver, give feedback, record approved credit, review mutually, and publish exact credit separately.
5. Revoke credit/profile publication and confirm anonymous new reads omit them. A different account's private ideas/reviews must never appear.
6. Verify an existing scoped agent still reads only permitted work, cannot publish, and fails after revocation. Never paste a credential into chat or source.

## Approved deployment — November 13, 2026

After explicit owner approval, `fb-collaboration` version 13 was deployed only to `ijvokvffhcvakaultzfk`. Readback of all seven deployed files matches the tested source. Existing internal authentication and `verify_jwt=false` gateway configuration were retained; the function verifies private access itself. No migration or participant-data publication was performed.

The matching frontend is Sites version 67, source `5dc5fbd120e5115f40d41ab2fe2e92c72704b759`, saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_ba4dfdf2947481918f50302ca4947bbc`. Deployment `appgdep_6af70f6f5f388191874ad594d02e71cc` succeeded at https://founders-builders-ux-review.hello978822.chatgpt.site with MCP retained and the same public audience.

Ten real anonymous/forged-token boundary requests passed. Four public projection kinds responded without account IDs, and unauthenticated profile publication returned 401 without a write. Scheduled collaboration-email dispatch remains inactive; daily retention remains active. Sign-in SMTP is unchanged. Fresh hosted human-account/browser acceptance remains pending, as distinguished above.
