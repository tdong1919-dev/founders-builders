# Verification — shared collaboration foundation

- Full repository regression suite: **232 passed**, including the new shared service and actual walkthrough controller tests.
- Static integrity: **50 HTML pages** pass assets/links/anchors/unique IDs.
- Two independent HTTP clients see the same contribution and recover progress after database close/reopen.
- Unauthorized/unverified identities cannot read private tasks or participant conversations.
- Stale proposal confirmation fails; changed terms invalidate acceptance; duplicate delivery retries record one event.
- Agent limits, expiry, task scope, owner-only revocation, credential hashing, human-only decisions and replay-after-revocation are checked server-side.
- Portfolio permission is separate from feedback/completion; future export fails after revocation, including a previously successful request key. Private completion and cancellation produce no false credit.
- Browser walkthrough against the persistent local service completed interest → proposal → confirmation → delivery → feedback → permitted credit; refresh preserved progress. Founder revocation removed the export action. The UI created and revoked a task-scoped sample grant.

Hosted public preview and responsive QA are recorded after publication. Live Supabase verification, actual remote-device connectivity and cloud persistence are not yet tested or enabled.

Responsive hosted walkthrough: 390×844 completed the full interest-to-credit journey; the initial action fits within the first screen (button bottom 719px). Mobile navigation opens/closes after loading. Desktop at 1280×900 and phone at 390×844 show no horizontal overflow. Hosted console warnings/errors: none. Interrupted actions preserve typed notes in page memory; the regression suite checks this behavior.

Published fictional review: https://founders-builders-ux-review.hello978822.chatgpt.site/shared-workspace.html · Sites version 12 · source 2b75519b89d72a01104e205ab7c6b9cf202f83ed. Private Node service and databases are not part of this deployment.

Final anonymous hosted check passed 44 HTTPS requests: existing A2A journeys, exact shared asset/source matches, fictional page availability, and 404 responses for private service and development identity endpoints. No bypass bearer was used.
