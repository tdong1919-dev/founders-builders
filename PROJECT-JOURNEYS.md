# Project and builder journeys

The real cloud workspace starts with “Build my project” and “Find work that fits me.” A project has an overview, next milestone, independent overview visibility and contribution steps. Earlier standalone contributions remain accessible. Builder profiles save skills, learning goals, task time and paid-only preference. Founders see only opted-in matching profiles; builder matches see only published tasks, not private project overviews.

Matching is deterministic and explained: exact normalized skill overlap, maximum task time, and paid-work preference. Learning goals are displayed for conversation, not scored by an invented AI model. Suggested matches never create applications or commitments by themselves.

People can explicitly issue task-scoped credentials for reading, applying, questions, exact-brief proposals and agreed-work submission, with request budgets, time limits and expiry. New UI-issued grants require profile fit for applications and prohibit agent changes to proposal terms. `matchTask` and `readContribution` let agents inspect fit and participant stage/version through the same authorization checks. Existing read-only grants do not gain new permissions. Credential issuance, profile/project changes, agreement acceptance, reviews and portfolio consent remain human decisions. External agents execute through their own tools; no always-on runner, unsupervised discovery across private records, payment handling or automatic scheduling is enabled here.

`agent-workspace.json` documents the JSON command transport. It does not claim A2A protocol conformance. All commands use the existing verified-account or scoped-credential Edge Function; events include human identity and grant attribution.

After completion, both participants can leave one private rating, useful feedback and a suggestion for next time. Only those participants can retrieve the reviews; nothing is published as a public reputation score. Orchestrator suggestions use the account’s stages and received improvement notes, with a visible rule-based label. Ecosystem-wide learned coaching and public mutual-review publishing remain future work requiring consent and support.

New maps are added lazily to the existing private JSON snapshot; no database table grants, schema migrations, credentials, billing or Sheets/Apps Script changes are needed. Existing records are preserved. `project-preview.html` uses fictional page-memory identities and the same domain rules, never Supabase/network auth, persisted browser state, external email or real credential issuance. Use one tab and switch roles; separate fictional tabs do not synchronize.

Initial deployment gate: automatic approval review required explicit authorization to replace the live authentication/private-data Edge Function. The user subsequently approved this exact deployment; current status is recorded below.

Validation and preview release: 267 Node tests and 52-page static checks pass. A fictional desktop walkthrough reached matching, application, proposal, confirmation, delivery, founder feedback, portfolio completion and a builder-to-founder review reflected in suggestions; mobile layout was inspected. Site version 17 published the fictional preview at https://founders-builders-ux-review.hello978822.chatgpt.site/project-preview.html. HTTPS checks confirmed preview assets match tested source and both live cloud frontend files remain byte-identical to their prior version. PR #22 contains the real-cloud implementation and remains draft and unmerged.

## Approved live beta activation

The user explicitly approved deployment of PR #22’s interface and the production `fb-collaboration` replacement. Edge Function version 3 is active on `ijvokvffhcvakaultzfk`. Ten real HTTPS boundary checks passed after deployment: anonymous/forged credentials, raw private tables, persistence RPCs and unapproved origins remain denied. No test email was sent. This supersedes the approval gate above. Real-account use of the newly added project/profile/review screens remains the next user acceptance check; it is distinct from the completed fictional walkthrough. No database migration, billing or Resend configuration change was made.

Sites version 18 deployed successfully at https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html. All five published workspace/network/agent manifest assets match tested source (hosting-injected HTML script excluded from comparison). The deployed signed-out page displays the new project journey heading without browser console errors.

## Private builder invitations (review branch)

Founders can invite an opted-in matching builder to explore a published step with a short private note. Invitations appear only to the founder and recipient; no email is sent. The builder can review scope, decline, or explicitly apply through the existing interest flow. Sending an invitation never creates an application, accepts terms or starts work. Duplicate invitations for the same builder and task remain blocked after decline. Existing scoped agents cannot invite or decline. Invitations are added lazily to the existing private snapshot; no schema migration is required. This feature is not deployed; it requires a coordinated frontend and Edge Function release after review.

## Invitation withdrawal, paused steps and progress

Founders may withdraw a pending invitation with the current invitation version. Withdrawn notes remain in participant-only history; no response is requested and existing applications cannot be withdrawn through invitation controls. Pausing a step blocks new human/agent applications, invitations, skill matching and new nonparticipant credentials. Existing conversations, agreed work, feedback and portfolio permissions continue. Only the verified task owner may pause or resume with the current version; agents cannot do either.

Progress totals use this account’s authorized records (the selected project for founders). Invitation totals include declined/withdrawn invitations; application totals include closed/cancelled conversations; agreements count confirmed terms; completed contributions count closed work. These are cumulative totals, not conversion rates or ecosystem rankings.

Validation: 284 Node tests and 52-page static checks passed. Desktop fictional walkthrough verified invitation withdrawal, pause/resume, application, confirmation, delivery while paused, feedback and credit. Mobile walkthrough at requested 390×844 viewport completed invitation → pause/resume → application → agreement → delivery → feedback → credit; observed content width equaled viewport width (375 CSS pixels). Both completed progress summaries showed 1/1/1/1. No real invitations, email or account actions were performed during browser QA.

Two-account acceptance after deployment:
1. Founder account: create a published test step with matching skills. Builder account: save a matching profile with discovery opted in.
2. Founder: invite the builder, then withdraw. Builder: refresh and confirm “Invitation withdrawn. No response is needed.”
3. Founder: pause the step. Builder: refresh and confirm it has no new match/application action. Founder: resume; builder can browse and apply explicitly.
4. Complete proposal → confirmation → delivery → feedback → portfolio credit. Check the project progress totals and that each account has the correct next action. Existing private-project isolation must remain intact.

Approved deployment completed: Sites version 19 and `fb-collaboration` version 4 are live at https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html. This coordinated release includes PRs #23–25. Ten live HTTPS access-boundary checks passed after the function replacement; published workspace assets match tested source. PRs remain unmerged. The user’s real two-account check remains pending. No migration, paid service, Resend or Sheets change was made.

## Conversations and return attention

A collaborator’s unanswered latest message brings a waiting contribution back into attention with “Reply to your collaborator.” This is a reply-needed cue, not a claimed unread receipt. The lifecycle action stays intact when it already belongs to this person. The conversation opens for an incoming message, shows participant labels and timestamps, and stays readable after closure. Replies and ending a collaboration have separate fields and controls. Messages are rendered as plain text; sign-out clears the private thread.

Validation: 289 Node tests and 52-page static checks pass. A fictional browser check confirmed founder question → builder attention → builder reply → waiting restored → founder conversation, followed by a mobile reply at 390×844 with no horizontal overflow. No database, Edge Function, permission, email, billing or Sheets changes are needed.

Conversation release: Sites version 20 deployed successfully. All four published conversation assets match tested source. Supabase function remains version 4. PR #26 is draft and unmerged. The next real-account check is to send a question while the recipient is waiting, refresh their workspace, and confirm it returns to attention; replying should restore the appropriate waiting/action state.

## Unsent contribution drafts

Application, delivery, feedback, review, closing-note and reply text is preserved in page memory across workspace refreshes and contribution switches. Draft keys include verified account, task, contribution and stage; another account or stage never restores the text. Nothing is sent automatically or written to local/session storage. Reloading warns when drafts exist; reload, navigation or sign-out clears them. A visible count and explicit discard action explain this limit. Successful commands remove only their submitted fields; failed sends retain drafts. Agreement/portfolio checkboxes and agent permission fields are never restored. Project/profile editors and the new-step brief are outside this first draft-protection scope.

Validation: 294 Node tests and 52-page static checks pass. Tests cover account/task/stage isolation, return-to-baseline clearing, failed-send retention, reload warning, sign-out clearing, workspace refresh and consent reset. Fictional browser QA confirmed application draft retention after refresh, no text exposure to the founder role, restoration to the builder and removal after successful application. This is frontend-only; existing cloud authorization and storage are unchanged.

Draft-protection release: Sites version 21 deployed successfully. All six published draft-related assets match tested source. Supabase remains version 4. PR #27 stays draft and unmerged. The authenticated two-account acceptance test remains scheduled by the user for tomorrow; no account messages were sent during this release.

## Founder project health

The selected founder project now shows four current-state groups: Needs you, Ready for feedback, Work in progress and Waiting on others. Each contribution appears in exactly one group; its action opens the exact task and applicant. Incoming collaborator replies bring waiting work into attention. Completed contributions that still need the founder’s review remain actionable; cancelled conversations do not count as active work. Paused intake is shown separately and never described as blocked ongoing work. Lifetime progress totals remain under a collapsed section. This view uses saved collaboration stages only; deadlines, blocked-work reports and success predictions are not inferred.

Validation: 298 Node tests and 52-page static checks pass. Tests cover exclusive grouping, missing completion reviews, incoming replies, paused intake, project/owner isolation and exact-applicant handoff without data mutations. Fictional browser walkthrough verified application → attention, proposal → waiting, confirmation → in progress and delivery → ready for feedback. Frontend-only; no schema, Edge Function, auth, email, permission, billing or Sheets changes.

Project-health release: Sites version 22 deployed successfully, and both published health assets match tested source. Mobile at 390×844 had no horizontal overflow and opened the correct feedback action. Supabase remains version 4; PR #28 stays draft and unmerged. Authenticated two-account acceptance remains pending. Check-in dates, explicit blocker reporting and the combined closing screen remain future work.

### Agreed check-ins and closing summary (2026-10-29)

Either participant can propose a future check-in (local datetime input stored as a UTC timestamp) and a short plan after work is agreed. The other person must confirm the exact proposal. Changing the plan resets confirmation; stale writes, past dates, outsiders, and agent confirmation/proposal/completion are rejected. An agreed due check-in appears in attention on workspace refresh. Either person can record an outcome to clear it. This does not change scope, delivery stage, compensation, or portfolio permission. No background reminders or email are sent.

The completed contribution now brings delivered work, founder feedback, current portfolio permission, and both participant-private reviews together. Missing reviews remain explicit; revoked credit cannot be exported. Existing consent controls stay in place. Check-in input drafts follow the same page-memory-only protections as other contribution text.

Validation: 303 automated tests and 52-page static checks pass. New tests cover counterpart confirmation, date validation, concurrency, private access, agent restrictions, due attention, recorded outcomes, UI confirmation and both reviews on the completion screen. Desktop/mobile browser QA could not run: browser inventory returned no available browsers. Real two-account acceptance remains pending.

Release status: source and generated Edge core prepared in a draft PR stacked on project health. Not merged or deployed. The live beta remains Sites version 22 / Edge function version 4. This update needs the Edge function and frontend released together after visual QA. No migrations, paid services, Resend or Sheets changes.

Follow-up recovery checks (2026-10-29): changing task terms now clears the old check-in so it cannot silently carry over into a new scope. Expired proposals offer a new time rather than an unusable confirmation button, and both participants can find that recovery from attention. Completion includes a direct link back to project progress or matched contributions. Validation now totals 306 passing tests plus the 52-page static check. Browser inventory was checked again and remains empty; desktop/mobile and authenticated acceptance are still pending. PR #29 remains draft and undeployed.
