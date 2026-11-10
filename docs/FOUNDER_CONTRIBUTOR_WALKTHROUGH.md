# Founder → contributor walkthrough

Verified locally on 20 October 2026. All names, projects, compensation and work below were fictional. No message or public form was submitted; nothing was signed or published.

## What changed

- The task builder leads with title, project, one deliverable, time, support, compensation and credit. Completion criteria, exclusions, starting knowledge and review details expand when needed and remain required before sharing. Unfinished drafts can still be saved. Readiness reports missing details; attempting to preview/share an incomplete task opens and focuses the first missing field in visual order.
- The founder review desk shows the contributor/task identity, a stage-based suggested action, and explicit **Clarify interest**, **Propose terms**, and **Give feedback** actions. These open the relevant fields without changing stages, agreements, review confirmations or sharing choices. Saving is near the stage selector; full context is expandable.
- Sharing labels distinguish readable text from structured notebook notes. Instructions explain where the contributor pastes an agreement or feedback note. Existing packet formats, Sheets request contracts and local records remain compatible.

## Browser walkthrough

| Step | Check and result |
| --- | --- |
| Discover a task | Opened `projects.html?scope=small`. The live feed was unavailable, and the page correctly declined to present demos as real tasks. Used its founder-task route and an unpublished local draft for the remaining browser checks. |
| Prepare a founder brief | Used the testing-task outline, entered a fictional project, purpose, reviewer and paid terms. Preview opened the missing purpose field inside completion details. Finishing the fields produced a valid brief and readiness confirmation. |
| Open the contributor journey | The preview imported the original task snapshot and labeled it a local founder draft, not published. No interest or contribution was saved automatically. |
| Express interest | Entered a chosen name, availability, proposed contribution and question. Explicit sharing permission was required for a minimized interest packet; the note was previewed and transferred manually to the review desk. |
| Clarify and propose | Founder previewed a specific reply, set a local stage, reused matching scope into empty fields, and added ownership and credit terms. Prepared a notebook agreement note without claiming acceptance. Saved one fictional local review. |
| Review terms | Contributor previewed the matching note, acknowledged it, added the proposal, reviewed terms and drafted a confirmation. Progress stayed planning; the reply was not sent or signed. |
| Request feedback | Set local progress to awaiting feedback, entered a fictional actual result and drafted a feedback/credit request. No message was sent. |
| Give feedback | Founder chose the working stage and opened the suggested feedback step. Preparing a note failed before reviewed-work and agreed-credit confirmations. After explicit confirmations, the founder prepared a notebook feedback note with limited portfolio use. |
| Record portfolio credit | Contributor reviewed and added the feedback source. Their own result remained intact. Portfolio preview failed until work was marked completed and fresh sharing permission was checked. The resulting summary included limited portfolio-use terms and visibly unverified received feedback. |
| Reopen and clean up | Saved/reloaded the contribution; actual result, agreement source and feedback source survived. Removed the fictional saved contribution and review using their UI controls. Reload left no test records. No founder task draft was saved. |

## Confusing handoff found and fixed

A newly opened task was marked “interest drafted · not sent” while its name/interest fields were empty. The next-step guide therefore pointed to reviewing terms too early. The initial fix guided the contributor to their chosen name and interest details first. The 21 October follow-up now guides a complete interest to reviewing/sharing the interest note; received agreement sources lead to terms review. See RELEASE_REVIEW_20261021.md for current checks and pending browser verification. A regression test and a second browser preview verify the correction.

The optional founder fields also remain mandatory for sharing. Collapsing them does not supply invented scope or waive completion/compensation/credit requirements. Feedback-only validation does not redirect the founder into unrelated unfinished offer fields.

## Automated and visual verification

All **110 JavaScript tests pass**. New coverage includes required-detail readiness/focus, review action opening without state changes, the first-interest regression, and a complete integration test from a public-discovery fixture through task handoff, minimized interest, proposal/confirmation gates, feedback review and permission-gated portfolio output. The fixture exercises the actual discovery controller plus the existing task, interest, return and contribution helpers; it is not a live public listing or multi-user authentication test.

Both founder pages were inspected at 390- and 1280-pixel widths with no horizontal document overflow. Notebook handoffs were exercised in the browser. HTML duplicate-ID/local-target checks and strict nesting checks on both changed founder pages pass; changed JavaScript syntax and diff whitespace checks pass.

## Remaining limits and deployment

Live task availability/publication and real exchanges are unverified because the live discovery feed is unavailable. Exchanges are still manual and device-local. Supabase, authenticated private collaboration, shared inboxes and cross-device syncing remain deferred. Sheets/Apps Script, authentication configuration and SQL are unchanged. No service-role key, paid service, production merge or deployment was introduced. Frontend changes remain in draft PR #8, stacked on #7.
