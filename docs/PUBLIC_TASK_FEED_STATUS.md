# Public task discovery: diagnosis and release boundary

Checked locally on 20 October 2026. Supabase remains deferred.

## Observed cause

The public endpoint configured in `config.js` responds to a read-only `?type=collab` request with:

```json
{"ok":false,"error":"Error: Unknown type: collab"}
```

The repository's `apps-script/Code.gs` defines the `collab` entity, so the configured deployment does not support the same collaboration contract as the repository. This indicates a stale or mismatched Apps Script deployment; it is not evidence that there are zero founder tasks. No personal records, private entity queries, form submissions or deployment changes were needed for this check.

## Frontend improvement

Discovery now describes the missing task connection instead of presenting it as a successful empty board. Other failures retain a generic unavailable state; raw server errors are not rendered. Starter planning and founder-task preparation remain usable.

A manual retry can check the feed again without a page reload. It disables itself and filters while one request is pending, clears the old cards, keeps filter values and re-enables filtering after a valid live response. Duplicate/late callbacks cannot override the settled or newer request. Malformed responses remain unavailable, while a valid empty array is correctly shown as zero listings. Demo records are never substituted for real opportunities. No API contract or endpoint configuration changed.

## Deployment blocker

Do not simply deploy the entire repository Apps Script to enable `collab`. Its `doGet` selects entities from a supplied `type` and returns their rows, without enforcing `entity.public`. Several repository entities are marked `public: false`, including administrative records. The flag alone is not access control. This is a finding about the repository handler, not evidence that the currently configured older deployment exposes those private types; no private endpoints were queried.

Before a backend release, restrict the public read surface to explicitly public types and public-safe fields, and authorize any private administrative read/write routes separately. A public-collaboration-only adapter is another option. Keep existing public profile and submission contracts compatible. Review the write surface too before exposing new entity types. Private founder ideas and project records should remain outside anonymous Sheets routes and wait for verified Supabase authentication/RLS if needed.

After a reviewed public-only implementation is ready, the account owner can update the intended Apps Script deployment and verify `collab` returns `{ok:true,records:[...]}` containing only intentionally public listings. Then test one owner-approved listing through discovery and manual contact without substituting fictional data. No backend release, permission change or public submission was performed in this task.

## Verification and cost

All 123 JavaScript tests pass. New checks cover unsupported-type messaging, raw-error suppression, recovery with retained filters, in-flight duplicate-click prevention, stale/duplicate callbacks, malformed responses and valid empty feeds. The browser confirmed the actual unsupported response, the user-facing explanation, disabled retry while checking, and retry completion with the small-task filter intact. Mobile and desktop layout review found no horizontal document overflow. HTML local-target/duplicate-ID, JavaScript syntax and diff whitespace checks pass.

The retry UI is in draft PR #8. Existing Sheets/Apps Script code, configuration, authentication and SQL remain unchanged. No paid service, production merge or deployment was added.
