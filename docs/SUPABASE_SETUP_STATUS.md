# Supabase setup and security review

Status: **prepared and tested locally; hosted project creation blocked; frontend disabled; not deployed to production**.

## Account and cost

A dedicated **Founders & Builders** organization was created with **Free — $0/month** selected. Organization ID: `xxziyshpttdfzxesjaky`.

Supabase's New Project form reports that overdue invoices in **Autom8** and **JIDOKA MARKETING OS** must be settled before a new project can be created. No invoices were paid, no plan upgraded, and no payment or paid add-on authorized. Do not create this project in a Pro organization to work around the block. Project creation, hosted tables, auth configuration, and repository integration are **not completed**.

The form was prepared with Data API enabled, automatic table exposure disabled, and automatic RLS enabled. These are unsaved form choices, not live project configuration. The browser setup tab is retained for continuation. Project database password entry must be completed by the user.

## PR #6 review and corrections

This branch includes PR #6's original schema and an additional hardening migration. It should be reviewed as a replacement/superset of that draft rather than merged twice.

- `fb_can_access_project(project,user)` previously allowed callers to probe another user's confidential ownership/membership. It now requires the supplied user to match `auth.uid()`.
- Request RLS policies queried the projects table despite revoked project SELECT. Private, identity-bound definer helpers now perform those checks without depending on raw project reads.
- Supabase can supply explicit function EXECUTE grants through default privileges. Revoking only PUBLIC is insufficient. The hardening migration resets API-role grants and grants anonymous execution only to teaser discovery.
- All four tables retain RLS and no API-role table grants. Direct membership writes and milestone mutation remain denied. Private RPC authorization is enforced inside SECURITY DEFINER functions with fixed empty search paths and qualified application tables.
- The initial migration is atomic to prevent partially created tables being visible before grants/RLS are configured.
- Writes require verified email identity; each user is limited to 100 projects, 20 applications per day, and each project to 250 milestones. Transaction advisory locks serialize quota checks for the same actor. Skills arrays have bounded size.
- Application submission locks the project while checking publication; owner review locks project then request and rejects repeated or null decisions. Acceptance and membership insertion share a transaction.
- Added scoped member listing and included accepted collaborations in the workspace list.

## Frontend

`workspace.html` is a separate private workspace, linked from the existing public projects page. It supports invite-only email OTP sign-in, private project creation, deliberate teaser publishing/unpublishing, public teaser discovery, applications, owner acceptance/decline, pending withdrawal, membership listing, and milestone creation/completion.

`secure-config.js` is intentionally disabled and has no project URL/key. Only `sb_publishable_` keys and HTTPS Supabase project hosts are accepted. Service-role, secret and legacy JWT-format keys are rejected. No key was retrieved or committed.

The client uses Supabase Auth and PostgREST HTTPS APIs directly, without a CDN dependency. Tokens stay in memory for this tab, never localStorage/sessionStorage. Reload requires sign-in; expired sessions require reauthentication rather than automatic refresh. Sign-out clears local private data immediately and attempts server revocation. Responses from a previous session are discarded. Server errors are not echoed because they may contain submitted confidential text. Project values render through `textContent`; no project data enters HTML strings. The workspace has a restrictive CSP and no external scripts.

Existing `config.js`, `platform.js`, Apps Script code, and public-hub data routes are unchanged. The private workspace has no Sheets fallback. Existing Sheets behavior was preserved by source comparison; no live Sheets write was performed.

## Verification performed

Latest local run: **37 SQL assertions plus negative-operation blocks passed**, followed by rollback. All 22 JavaScript tests also passed (12 client tests and 10 workspace event-handler tests).

- Executed all three migrations on disposable local PostgreSQL, including owner-controlled membership revocation.
- Executed `supabase/tests/security.sql` with owner, applicant/member, outsider, unverified identity and anonymous role contexts; all assertions passed. Tests roll back fixtures and temporary grants.
- Repeated against Supabase-style table/function default grants; all assertions passed.
- Checked private reads, teaser projection, owner-only writes/review, accepted/declined membership, milestones, forged membership, self/private applications, repeated acceptance, anonymous EXECUTE denial, and RLS independently of table ACLs.
- `node --test tests/*.test.cjs`: 12 passed. Covers disabled config, secret-key rejection, auth requirement, invite-only OTP, auth headers/signout, stale responses, safe errors, verified identity and expiration.
- JavaScript syntax and `git diff --check` passed.
- The Netlify PR preview was opened and its disabled workspace state verified: private forms are hidden and existing community links remain available. Enabled authenticated UI journeys are **not verified**. Unit tests are not a substitute for hosted testing.

Local bootstrap is exclusively for disposable PostgreSQL: **never run `local-bootstrap.sql` in hosted Supabase**. It stubs `auth.users` and `auth.uid()` and does not test Supabase's real auth service, JWT verification or email delivery. Example local sequence:

```sh
psql "$LOCAL_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/tests/local-bootstrap.sql \
  -f supabase/migrations/20261017_secure_projects.sql \
  -f supabase/migrations/20261018_secure_project_hardening.sql \
  -f supabase/migrations/20261019_membership_revocation.sql \
  -f supabase/tests/security.sql
node --test tests/*.test.cjs
```

## Remaining gates before activation

1. Resolve the Supabase account restriction or provide an eligible, dedicated existing Free project. This work does not authorize payment.
2. Create the project on Free, disable automatic table grants, enable RLS, and apply all three reviewed migrations. Verify actual table ACLs, function ACLs, policies and advisors in hosted Supabase.
3. Keep self-signup disabled; invite approved test accounts. Configure the Magic Link email template to show `{{ .Token }}` for email OTP. Test email delivery to each approved user; Supabase's built-in mail restrictions may require SMTP configuration. Do not buy mail services without approval.
4. Add the real project URL and public `sb_publishable_` key to `secure-config.js`, leaving `enabled: false` until hosted tests pass. No service-role key belongs in static files, previews, logs or GitHub.
5. Repeat the role matrix with actual authenticated JWTs through the Data API, including session expiry/signout and mobile/desktop UI. Test quotas and concurrent accept/withdraw/publish operations under load. Local tests do not establish these hosted results.
6. Link repository through the Free-compatible integration if available without paid branching, or use reviewed migration files and manual SQL application. Do not enable automatic unreviewed production migrations or paid preview branches.
7. Verify owner-controlled membership removal with live sessions; add account deletion and abuse handling before broad public access. The UI deliberately has no raw member-role editing.
8. Review/merge the PR only after these gates pass. Preview deployment may be generated automatically by the repository's existing Netlify integration. No production merge or deploy was performed here.

Supabase references: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [verify OTP](https://supabase.com/docs/reference/javascript/auth-verifyotp).

## Continuation: access revocation

The Supabase creation form was rechecked and still displays the same outstanding-invoice block. The connected Supabase MCP endpoint resolves to the unrelated Front End Quiz project (`hgnkpyfxghglsxqprphy`); no database reads or changes were made there.

`20261019_membership_revocation.sql` adds owner-only member removal, a private audit table, and synchronized milestone writes. Removing a member also closes the accepted application and denies subsequent private brief, member list, workspace list and milestone operations. This cannot retract data already received by that user. The rollback-only security suite now checks revocation, repeat removal, outsider denial, post-removal reads/writes and audit ACLs.

The preview was verified to show the pending-setup message and no private submission forms. Hosted schema/auth tests, signup/email configuration, repository integration and activation remain blocked.

## Continuation: sign-out responsiveness

Sign-out stays available during pending operations. It clears local authentication, cancels in-flight private requests and discards responses from earlier sessions. Requests time out after 20 seconds. Tests cover immediate cancellation, failed server logout still clearing local access, and a stalled request timing out without waiting in real time.

The latest browser recheck reached an expired Supabase session. GitHub sign-in failed with `Failed to fetch (auth.supabase.io)`. Current invoice/project eligibility could not be reverified; the outstanding-invoice restriction remains the last observed project-creation result. No hosted project, credential or billing changes were made.

## Continuation: owner project editing

Owners can edit a project's title, teaser and private brief. Private saves preserve private visibility; editing published title/teaser content requires an explicit review checkbox. Stage, skills and collaboration model stay unchanged unless the owner edits them. Collaborators cannot access the editor or invoke its save handler successfully; database owner checks remain the authority.

Five workspace tests execute real event handlers using a small DOM adapter: private edits, explicit review for public edits, collaborator denial, text-only rendering/private-form clearing on sign-out, and sign-out availability during pending work. These are local functional tests, not a replacement for enabled browser flows or real Supabase Auth testing. No new migration is required for this editor.

## Continuation: project planning fields and milestone dates

Creation and owner editing now include stage, skills needed and collaboration terms, using the existing RPC parameters and database enum constraints. Skills are trimmed and deduplicated case-insensitively, with at most 30 entries/1,500 characters. Public edits still require content review, and these fields are included in the project detail and public teaser card.

Owners and accepted members can add milestones with an optional due date, recorded at end-of-day UTC. Calendar dates are validated before submission. Milestones show due dates and a completed/total count. Completion continues through the existing membership-scoped RPC; this does not grant collaborators project-editing access.

All 22 local JavaScript tests passed. New checks cover creation metadata, owner edits, invalid enums/oversized skill lists, collaborator milestone progress and due dates, and rejection of nonexistent dates. No migration changes or hosted database access were required. Enabled browser and hosted authentication tests remain outstanding.
