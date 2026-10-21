# Apps Script public/private boundary

Implemented locally on 20 October 2026 on a backend branch stacked on frontend PR #8. **Not deployed.** The configured older endpoint still rejects `type=collab`; no production read/write behavior has changed.

## Intended anonymous surface

| Operation | Allowed |
| --- | --- |
| Read public listings | Explicit types: profile, business, listing, job, mentor, help, raise, investor, event, collab, podcast, resource. Only allowlisted fields are returned. |
| Append public listings | The same types, with server validation and an explicit field list. Private-visibility intent is rejected. |
| Append private intake | Reports, event-source requests and concierge requests only. These are unverified requests, not admin actions. |
| Read private records | Denied, including the three intake types. No sheet is opened. |
| Account, saved-item or admin operations | Denied. No owner-key, email or supplied confirmation bypass exists. |
| Unknown/new entity types | Denied until explicitly allowed. Inherited object keys cannot route to an entity. |

Private account, admin, chapter, activity, graph and seed-template tables remain accessible to authorized owners through their normal trusted Sheet/editor access, not this anonymous API. No new authentication implementation is claimed. Supabase remains deferred.

## Public reads

The handler filters rows **before serialization**. Private visibility and false/nonpublic `isPublic` values are excluded. Both `status` and `moderationStatus` must be blank (legacy public rows), Active, Approved, Public, Published or Open, case-insensitively. Hidden, draft, pending, closed, demo and unknown future statuses do not publish. Before any deployment, the sheet owner must review legacy rows with blank status: the compatibility rule treats those existing public-sheet rows as public, and code cannot infer whether free text was intended to be confidential.

Returned fields are independent of physical sheet headers. Adding `adminNotes`, credentials or another internal column to a public sheet cannot expose it through the response. Owner keys, account emails, report counts and funding disclaimer receipts are omitted. Intended public contact emails and public attribution remain available to preserve the existing directories and contact links. Manual verification/moderation metadata is read-only; it is not an identity or agreement attestation.

The response keeps `{ok,count,records,profiles}` and newest-first ordering, including default profile requests that omit `type`.

## Submissions

A public append cannot set owner keys, account emails, verification, report counts, timestamps, moderation or arbitrary columns. IDs/timestamps and existing defaults come from the server. Public submissions remain Active under the existing publishing convention; this patch does not add pre-publication moderation or authenticated ownership. Use public-safe details only.

One-way intake preserves request fields but ignores admin notes and approval/sync/secret/status overrides. Event-source permissions must be affirmative, not merely nonempty. Required-field and enum checks remain. Nested/oversized fields and malformed JSON are rejected. The body limit is 100,000 characters and each accepted field is at most 20,000 characters. Formula-leading submitted strings receive a literal-text prefix before appending. Google documents that [appendRow interprets a value beginning with `=` as a formula](https://developers.google.com/apps-script/reference/spreadsheet/sheet#appendRow(Object)); the prefix and actual cell/read-back behavior still need verification in the isolated Google runtime test.

Investor classification now travels as `investorType` so routing no longer overwrites it. The funding form also preserves its draft and reports only that a request was sent after an opaque no-cors response; it does not claim publication or redirect as though acceptance were verified.

## JSONP and errors

Callbacks must be a single JavaScript identifier of at most 128 characters; expression/dotted/indexed callbacks are rejected before sheet access. JSONP keeps the existing generated callback names and escapes less-than/Unicode line-separator characters while round-tripping the original text. Invalid callbacks return JSON without reflecting the supplied expression. Internal service errors become generic messages rather than exposing Sheet IDs or diagnostic data.

## Verification

All **135 JavaScript tests pass**, including the prior 123 tests, ten handler boundary tests and two funding handoff tests. The actual `Code.gs` handlers run in a VM with mocked SpreadsheetApp, Utilities and ContentService APIs. Tests cover every private read, blocked admin/account writes before sheet access, each public append/read contract, one-way intake defaults, server-managed fields, unknown columns, private/unknown statuses, JSONP validation/round trips, malformed input, consent, formula prefixes, error suppression, and a full founder brief through append/read/parser round trip. Investor routing and funding response handling are exercised through the actual frontend controller with a mocked network.

These tests do not establish behavior in the deployed Google runtime, spreadsheet permissions, live publication, rate limits, or authenticated multi-user access. No real Sheet was read or written during this patch. A separate staging verification remains necessary before deployment.

## Release steps remaining

1. Review this backend diff independently of the frontend PR and verify the explicit public field lists match intended publication, especially contact emails and legacy blank-status rows.
2. Use an isolated test sheet/deployment to verify denied private types, public-only returned columns, literal-text storage, one-way intake and unchanged profile/collab response shapes. Do not test private-route denial against production records or post fictional tasks publicly.
3. Check the funding classification handoff and opaque-response message. Private admin/account HTTP features intentionally remain disabled until an authenticated backend exists.
4. Only after review and staging, update the intended public Apps Script deployment and confirm `collab` is recognized. Preserve the existing URL if updating its version; do not change `config.js` speculatively.
5. Test discovery using one intentionally public, owner-approved task. Confirm scopes, availability and contact directly. Keep private founder/project data out of this anonymous route.

No paid service, live permission change, production merge or deployment was added. No Supabase code, configuration, SQL or service-role key was introduced.
