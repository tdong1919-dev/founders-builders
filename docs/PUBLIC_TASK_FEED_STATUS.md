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

## Deployment blocker and local fix

The diagnosis found that the repository read handler did not enforce `entity.public`, even though several entities were marked private. No private endpoint was queried; this was not evidence that the older configured deployment exposed those types.

A separate backend patch now adds explicit public field/type allowlists, server-side visibility filtering, blocked private reads/admin writes, restricted one-way intake, server-owned metadata and callback validation. It remains unmerged and undeployed. See [Apps Script boundary details](APPS_SCRIPT_PUBLIC_BOUNDARY.md) for the policy, compatibility tests and remaining staging checks.

The account owner should not broadly redeploy until that patch is reviewed and verified against an isolated test sheet. Legacy public rows with blank status and intentionally public contact emails also need publication review. Private founder ideas and shared project records remain outside the anonymous route; authenticated Supabase access/RLS stays deferred.

After review/staging, update the intended deployment and confirm `collab` returns `{ok:true,records:[...]}` with only intentionally public listings. Then test one owner-approved listing through discovery and manual contact. No backend release, permission change or public submission has occurred.

## Verification and cost

All 123 JavaScript tests pass. New checks cover unsupported-type messaging, raw-error suppression, recovery with retained filters, in-flight duplicate-click prevention, stale/duplicate callbacks, malformed responses and valid empty feeds. The browser confirmed the actual unsupported response, the user-facing explanation, disabled retry while checking, and retry completion with the small-task filter intact. Mobile and desktop layout review found no horizontal document overflow. HTML local-target/duplicate-ID, JavaScript syntax and diff whitespace checks pass.

The retry UI is in draft PR #8. Existing Sheets/Apps Script code, configuration, authentication and SQL remain unchanged. No paid service, production merge or deployment was added.
