# Cohesive sandbox journey and recovery

The supported fictional design task in the discovery directory now links directly into the orchestrator's task summary. Discovery JSON, card scope and mission preview agree on the task title, deliverable, 45-minute limit and feedback support. Other sample tasks do not imply that the current founder endpoint supports them. No profile, contact details or private project data travel in this link.

The existing orchestrator page now shows discovery context, settings, a read-only mission-plan preview, communication trace and the owner report in one journey. The preview explains review-first vs delegated operation and predicts the fixed scenario's time, message, clarification and drafting boundaries. Predictions do not replace server checks, grant new authority, make network calls or silently change settings. Users can still run a bounded case to observe the actual server stop.

A stopped or failed run offers one allowlisted recovery action that focuses the relevant setting: time limit, message budget, the restricting side's clarification/draft permission, or general mission review after a request failure. The button does not modify a permission, retry a request, start a new run, or override another person's preference. Explicit edits stop the current run; the next Start creates a fresh one as before.

A decision-in-flight guard now prevents repeated and post-completion decision handlers from sending a second request or relabeling a finished run as failed. Late responses remain isolated by run epoch; they cannot populate a newer trace or report. UI status, copied aggregates and draft-prepared outcomes remain separate from any real-world acceptance or contact.

## Validation

220 tests pass, including nine added discovery/plan/recovery/duplicate-decision/controller-to-server tests. The full controller → real builder client → founder handler journey covers proposal pause, manual approval, delegated drafting, policy stop, request failure and minimized owner-report copying. Tests use a substituted DOM, not a rendered browser. The existing suite also performs actual loopback HTTP communication. Required controller/recovery IDs are checked against page markup, and task scope is checked against discovery data. All 49 HTML pages pass local asset/link/anchor/ID checks, changed JavaScript parses and diff whitespace checks pass.

The browser was checked and reached the owner-private sign-in gate. Rendered desktop/mobile walkthrough remains unverified; no browser access restriction was bypassed. Hosted protocol checks run separately over HTTPS using existing Site service access kept in hidden stdin memory. Publishing preserves the existing private review Site, server-only signing secret, disabled Supabase and empty live Sheets endpoint. No database work, new credentials, paid model runtime, real founder contact or main-branch merge is involved.
