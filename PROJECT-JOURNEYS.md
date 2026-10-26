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
