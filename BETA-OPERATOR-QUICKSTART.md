# Five-minute beta operator routine

Operator: Crystal / JIDOKA Group. Support/privacy: support@getjidoka.com. Only use the Founders & Builders Supabase project **ijvokvffhcvakaultzfk**. Do not use a JIDOKA product database.

The local `scripts/beta-admin.mjs` planner prints bounded, reviewable SQL for the owner-only Supabase SQL Editor. It never connects, accepts credentials, sends an email, creates a browser admin role, or deletes an account. Keep the SQL Editor results private; queue/review data must not be copied into GitHub or public assets. EA can help prepare the same plan, but the operator still makes the decision.

## 1. Review the queue

```bash
node scripts/beta-admin.mjs queue
```

Paste the generated read-only query into this project's SQL Editor. Review pending requests and pending/follow-up reports. Note the current snapshot revision before preparing a report or suspension action. Empty queues require no action.

## 2. Approve one member

Verify the request/address through the normal invitation process. An unverified submitted email is not proof of ownership. Then use the exact pending request timestamp shown by the queue (convert its presentation to UTC ISO form):

```bash
node scripts/beta-admin.mjs approve --email person@example.invalid --created-at 2026-11-13T00:00:00Z --verified
```

Review and run the resulting transaction. It requires that exact request to remain pending; a stale/missing request fails. It activates that exact address and marks its request invited. No email is sent and no marketing subscription is created. The participant requests their sign-in email from Workspace themselves. Never reuse this fictional address in a real invitation.

## 3. Review a report

Read only the necessary private details. Record a factual outcome and next action; do not treat a report as a proven allegation. Use its exact UUID and current state revision:

```bash
node scripts/beta-admin.mjs review-report --id 00000000-0000-4000-8000-000000000123 --revision 35 --outcome needs_followup --note "Request clarification through support."
```

Allowed outcomes: `resolved`, `dismissed`, `needs_followup`. A later follow-up review uses `--expected-status needs_followup` and a freshly read revision. The transaction changes only that report, records review time/note, and fails on stale state. It does not suspend anyone or send mail. Keep any separate response within the authorized support workflow.

## 4. Stop abusive access

Participants can block new outreach themselves in **Email & safety**. Blocking is not account suspension and does not cancel agreed delivery/feedback/closing.

For an operator suspension, verify the exact Auth UUID/address and decision first:

```bash
node scripts/beta-admin.mjs suspend --email person@example.invalid --id 00000000-0000-4000-8000-000000000123 --revision 35 --verified
```

The reviewed transaction disables approved human access, revokes that person's agent grants, hides their public cards/credit, stops email preferences and cancels unsent queued updates. Shared work and Auth identity are retained. Recheck human/agent denial afterward. Restoring access is a separate operator decision, not an unblock button or automatic inverse; do not reactivate old grants or publication silently.

## 5. Handle data/deletion requests

The account settings link opens an addressed email draft; the person sends it themselves. Verify account ownership. Acknowledge within 7 days and aim for completion within 30 days. Prepare the read-only inventory:

```bash
node scripts/beta-admin.mjs deletion-plan --id 00000000-0000-4000-8000-000000000123
```

Then follow the ordered checklist in the output and OPERATIONS.md. Review shared-record retention and exports, revoke access, withdraw publication, obtain exact confirmation before permanent deletion, and verify completion. There is deliberately no generated purge: an empty test account and an account with shared work are different cases. Backups and participant-held copies have separate retention limits.

## Daily release/health check

```bash
node scripts/check-release-health.mjs
```

This checks public HTTP availability and private-source 404s without cookies, tokens, writes or email. Review provider metadata/logs for failures; expected 401/403 denial checks and intentional 404 probes are not automatically incidents. This is manual, not an installed monitor or alerting subscription.

Review Supabase database size, aggregate JSON size (application write cap: 2,000,000 serialized characters), task/contribution caps, error/429 trends, pending queues and maintenance success. Check actual provider dashboards for egress, monthly invocations/MAUs and shared Resend use; local HTTP checks do not prove remaining quota. Pause new approvals if capacity or abuse is uncertain. Never enable paid upgrades or collaboration email dispatch to resolve a warning without a separate decision.

## What was tested

`node scripts/verify-beta-admin.mjs` runs an isolated, socket-only PostgreSQL drill (set `FB_PG_BIN` if your installed PostgreSQL binaries are elsewhere). The drill verified these actual generated approval/report/suspension plans with fictional identities, including stale revision rejection, public-card withdrawal, email cancellation, retained shared data and revoked-agent denial. No production member/report was changed. Current-code synthetic recovery also exercises private reporting, blocking, suspension and disposable fixture deletion; it is not a new real Auth deletion or hosted two-account acceptance test.
