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

### Release journey verification (2026-10-29)

Added a full handler-level journey with two simulated verified identities and fresh storage reads: application → terms → check-in proposal → counterpart confirmation → recorded check-in → delivery → feedback → portfolio credit → both reviews → credit revocation. Duplicate proposal retries return the original result without duplicate activity; stale edits fail; an unrelated identity cannot read participant notes or reviews. The test sends no emails and does not use production accounts. All 307 automated tests pass. This supplements, but does not replace, browser and real-account acceptance.

Remaining release walkthrough at desktop and mobile:
1. Founder proposes a future check-in; builder sees and confirms the same local-time equivalent and plan.
2. Either side suggests a new time; the other confirms. Refresh each side to verify saved status.
3. Record the check-in outcome, deliver work, share feedback, and record permitted credit.
4. Both sides review the completion summary and leave their review. Check the next-contribution link.
5. Revoke portfolio permission as founder; refresh builder and verify export is unavailable.

Browser control still reports an empty inventory. No preview server was started and no deployment attempted in this pass. Live remains Sites 22 / Edge 4; PR #29 is draft. Release both components together after the visual walkthrough, then perform the real two-account check.

### Clear first step (2026-10-29)

New founders see a short private-by-default project introduction and the sequence overview → contribution → builder matching. Until a project or first step exists, setup guidance replaces empty health totals and generic orchestrator suggestions. Builders without a profile get profile guidance and can still browse available contributions. Existing invitations or collaborations bypass setup gating, so no active handoff is hidden. Builder progress totals are collapsed below attention; matching still uses current skills/time/payment preferences, while learning goals provide context.

Validation: 309 automated tests pass and static checks pass for 52 pages. Added pure-state and controller tests for role-specific guidance, ownership isolation, direct browsing without profile creation, and preserving existing action queues. No server or permission changes. Desktop/mobile visual verification remains pending because browser access is unavailable. This frontend refinement is stacked on PR #29, unmerged and undeployed; live remains Sites 22 / Edge 4.

### Approved beta deployment (2026-10-29)

User explicitly requested deployment. PR #29 check-ins/closing and PR #30 onboarding are now published at https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html (fictional walkthrough: /project-preview.html).

- Sites version 23, saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_2d90a5e920748191a38e0d1e7c61fa77`; deployment `appgdep_6ae3d1e231248191942214ee6a5fadc5` succeeded at 2026-10-29T23:08:24Z.
- Hosting source commit `5816c865c74a7ac54c441dda14eaac7edaca8307`, built from tested app commit `dd5499cf73d258e7e671d20a1a09a4e57a48e8c8`. Four changed frontend assets verified byte-identical live.
- Supabase project URL verified as `https://ijvokvffhcvakaultzfk.supabase.co` before deployment. `fb-collaboration` version 5 ACTIVE; source hash `776880fb5240f9a1e7b8c8834297629383c58cdd5e8281cd3469e0b4b47201fb`. Existing internal human/agent authentication retained.
- All 10 real HTTPS boundary checks pass: anonymous/forged identity, raw private tables, private RPCs and unapproved browser origins denied; email authentication available. No email sent.
- 309 automated tests and 52-page static validation passed before publication. Desktop/mobile visual QA and live two-account acceptance remain pending. PRs remain draft/unmerged. No migrations, new costs, Resend or Sheets changes; Site audience preserved.

### Agent connection foundation (2026-11-08)

Prepared a task-scoped MCP adapter for the existing Edge handler, an owner connection guide, and public capability metadata. Tool discovery validates an unexpired, unrevoked, unexhausted grant without consuming action budget. Data actions retain server-side task scope, version checks, audit and request-key retry behavior. Tool listing is filtered by grant actions. No human-only decisions are exposed. Existing JSON command API remains supported.

Validation: 312 automated tests and 53-page static checks pass. New adapter tests cover authentication, filtered tools, no-budget discovery, cross-task denial, invalid origins/versions/batches, revocation/exhaustion and idempotent message retries. No real credentials or messages used. Browser QA and external-client acceptance are pending.

Not deployed: Supabase connector is unavailable in this session. Backend must publish all four function files together before advertising the prepared endpoint as live. Existing Site 23 / Edge 5 remains unchanged. This is MCP access, not an A2A task server or an economic payment system. See AGENT-CONNECTION.md for JIDOKA EA acceptance and next A2A milestone.

### PR #31 approved publication (2026-11-08)

Supabase tools became available. Read-only project checks verified name `founders-builders`, ID/ref `ijvokvffhcvakaultzfk`, URL `https://ijvokvffhcvakaultzfk.supabase.co`, and ACTIVE_HEALTHY status before deployment. No JIDOKA project was queried or changed. Existing function version 5 was retrieved before replacement.

Deployed all four files for `fb-collaboration` version 6, ACTIVE, hash `e377ecc4843aecc7f1df2abad86dd197ee093fb877f7b43e80bd025a2b52aa08`. Internal verified human/limited-agent authentication and verify_jwt=false retained. No migrations or schema changes.

Sites version 24 published successfully at https://founders-builders-ux-review.hello978822.chatgpt.site/connect-agent.html . Saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_ceccf5e5ae548191951deb346f64c0db`; hosting source `31c71a4c1e44642846d2b57f16f708f47109c4c8`; deployment `appgdep_6af0c5b5b928819198082d6aa3e4f103` succeeded 2026-11-08T18:55:55Z. Site audience remains public; no Sites MCP capability declared because this endpoint uses owner-issued Supabase task grants rather than Sites identity.

Validation: 312 automated tests and 53-page static checks pass. Ten existing real HTTPS security boundary checks pass. Four additional live MCP checks pass: anonymous/forged initialize denied, unapproved origin denied, GET returns 405 as the stateless endpoint does not stream. Live JSON metadata and core are byte-identical to release source; connection page shows deployed status and external acceptance pending. No sign-in email, real collaboration message, or new agent grant was generated by this release.

Remaining: real owner-issued read-only credential handshake from JIDOKA EA, followed by authorized message/revocation acceptance and desktop/mobile visual QA. A2A task exchange, OAuth onboarding and payments remain unimplemented. PR #31 stays draft/unmerged. No costs, Resend or Sheets changes.

### Visible agent access (2026-11-08, PR #32)

User could not find the controls because Agent access was collapsed inside the hidden task section. Added Connect my agent beside signed-in account controls, a direct reveal/scroll action, an agent-specific contribution selector, and no-task guidance. Opening does not create a credential or grant permissions. 313 tests and 53-page static checks pass.

Published Sites version 25, saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_245b642d862c81919fddfd1de00ec337`, hosting source `a909865781d6b64a1825e882a9793091872952db`, deployment `appgdep_6af0c7f2c5288191944e59625c963af6` succeeded 2026-11-08T19:05:29Z. Both live controllers match tested source exactly and workspace HTML includes the entry/panel targets. Backend remains version 6; no database changes or new costs. PR #32 draft/unmerged, browser visual and external EA acceptance pending.

### Agent oversight and authenticated MCP check (2026-11-08)

Owner-supplied short-lived task grant successfully initialized live MCP 2025-11-25, listed permitted tools and read the authorized task. No private content was printed and no collaboration mutation was performed. The tool list included message/propose, so the test grant was action-capable. User requested leaving it active; it was not revoked or extended. No credential value is recorded in files.

PR #33 makes grant capabilities visible: read-only/action-capable status, allowed actions, requests remaining, time limit, expiry, matching/exact-brief restrictions and revoked/exhausted state. Activity identifies humans/agents with timestamps. Owner/task filtering retained. 315 automated tests and 53-page static checks pass; both published controllers match source exactly.

Sites version 26 published, saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_577f582b36088191aaa64bd8a1692123`, hosting source `f8f6bed8a6a60aa7b88c41b0e4d1efdf92b0f710`, deployment `appgdep_6af0c976e2988191a76da4ed7c421371` succeeded 2026-11-08T19:11:56Z. Backend remains version 6. PR draft/unmerged; visual QA and an actual JIDOKA EA host connection remain pending. No new costs or database changes.

### A2A owner-handoff pilot prepared (2026-11-08)

Built A2A 1.0 JSON-RPC SendMessage/GetTask/CancelTask for a narrow agent-to-own-owner coordination loop. A new coordinate permission is explicitly opt-in; old grants are unchanged. Persisted agent tasks are private to the owner and original grant. Questions surface in Agent requests; human answers return as artifacts, cancellation is idempotent, and collaboration terms/stages remain untouched. No streaming, files, webhooks, payments or autonomous cross-founder execution. Root well-known card route is prepared but not published.

321 automated tests and 53-page static checks pass, including persisted owner handoff, response artifacts, version conflicts, cross-owner/grant denial, revocation, old-grant denial, idempotency, terminal-state restrictions, card consistency and UI next action.

Verified founders-builders project ijvokvffhcvakaultzfk ACTIVE_HEALTHY and existing Edge version 6 before attempted deployment; no JIDOKA queries. Saved prior function source in session memory. Automatic approval review rejected replacing the active production function because the replacement includes auth/authorization/persistence/MCP/A2A routing and build approval did not clearly authorize that live blast radius. No workaround attempted; no deployment occurred. Site remains 26, Edge remains 6. Publication requires explicit approval for the reviewed function replacement and paired frontend. User test grant was not altered.

### Approved A2A pilot publication (2026-11-08)

User explicitly approved replacing the live function and publishing the paired frontend after the automatic review rejection. Reverified founders-builders ID ijvokvffhcvakaultzfk ACTIVE_HEALTHY and existing version 6 before replacement; no JIDOKA access.

Edge `fb-collaboration` version 7 ACTIVE, hash `49e7ef13ba1c1a3d6001e4140d1134882c0e6a7fb20b537e32354136a20f0f7a`. Existing internal verified-human/task-agent authentication and verify_jwt=false retained. New coordinate action is opt-in only; old credentials were neither extended nor revoked. No schema migrations or paid services.

Sites version 27 published: saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_67567a4bc9008191adf4ed234f3e0fc4`, hosting source `1b6346b873fe85c563afa6741d23d66a9661bb26`, deployment `appgdep_6af0cc45ba988191864c2aadf82bad21` succeeded 2026-11-08T19:23:55Z. Public Site audience preserved. Five live release assets matched source byte-for-byte, but the final root discovery check found the older sandbox route took precedence. The correction is recorded below.

321 automated tests and 53-page static checks pass. Ten existing live privacy/auth boundary checks pass; A2A card matches server source, anonymous/forged/origin-denied requests and MCP anonymous-denied checks pass. No real coordination question or sign-in email was sent. Real JIDOKA EA host request→human response→artifact/cancellation acceptance and desktop/mobile visual QA remain pending. PR #34 remains draft/unmerged; MCP continues to be available. No Resend or Sheets changes.


### A2A discovery routing correction (2026-11-08)

Final live verification caught a route collision: the old fictional sandbox intercepted root /.well-known/agent-card.json before the new static card lookup. Corrected root discovery to the real owner-handoff pilot, moved fictional discovery to /a2a/sandbox-agent-card.json, and updated the fictional client. Added an actual built-Worker routing test, preserving standalone sandbox behavior. 322 full-suite tests pass.

Sites version 28 supersedes version 27. Saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_98b393c02ff08191b89922503ac1fedc`, hosting source `2d47e7d5d017bda4c9f5bbedb6fa181dcb0aee00`, deployment `appgdep_6af0ccec75c88191b06123764f3aa8bb` succeeded 2026-11-08T19:26:42Z. Live root card matches the real pilot, fictional card remains separate, and live fictional handshake/cancellation passes. Sandbox client matches source. Backend remains version 7; no further backend replacement was needed. No new grants, real coordination questions, emails, costs or database changes. Real EA host and visual acceptance remain pending.

### External agent quickstart kit (2026-11-08, PR #35)

Added agent-quickstart.json (no credential), a three-step guide, and a dependency-free external A2A client/CLI. Discovery sends no credentials; the client pins the verified project endpoint, rejects redirects, sanitizes errors, requires stable caller message IDs, and performs no automatic retry or background polling. The CLI takes credentials through injected environment settings and emits task ID/status only. No real grant or coordination question was generated. Existing MCP tools do not bridge these A2A methods; the host needs HTTPS access.

327 tests and 53-page static checks pass, including client→real adapter→core→owner response→artifact, foreign endpoint denial, cancellation and secret-free metadata. Live public discovery passes without credentials. Published setup packet and manifest match source exactly; live guide contains the three-step EA section.

Sites version 29 published, saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_675479a485b48191b0b5544f1b245929`, hosting source `1a598177b2f561615d082fdb1e8cc806dd30fa5e`, deployment `appgdep_6af0cfbd09c48191b582f76fa0bfdd0c` succeeded 2026-11-08T19:38:42Z. Backend remains version 7. PR #35 draft/unmerged; real JIDOKA EA host and browser visual acceptance remain pending. User was asked how EA connects; the answer is not required for this transport-neutral kit. No new costs, schema changes or JIDOKA database access.

### Regular ChatGPT discovery connection (2026-11-08, PR #36)

Owner identified EA as a regular ChatGPT project associated with jidokagroup/jidokagroup. Inspected repository instructions and integration references read-only; no JIDOKA edits or database calls. Native ChatGPT private MCP authentication differs from the existing task bearer endpoint, so the first native connection exposes only public metadata through Sites.

Added Site /mcp with server/discover, initialize, tools/list and two read-only public metadata tools. No private IDs, credentials or actions are accepted. Identity/auth headers never enter returned metadata. Hosting manifest declares mcp capability. 331 tests and 53-page static checks pass, including actual built-Worker routing and private-command denial.

Sites version 30 published successfully; saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_49c238db29a08191bd3560b3670f5edd`, hosting source `030a47f6c2c4a9f10959efa798c9e74d2180678b`, deployment `appgdep_6af0dcc74fdc81919cc5de1c41c46e83` succeeded 2026-11-08T20:34:32Z with has_mcp=true. Generated plugin `plugin_asdk_app_sites_f11b98474b308191a12552ec5663d840` at Site /mcp. Suggest/install returned already_installed; this does not prove authentication health. No generated tools appear in the active conversation yet.

Native authenticated acceptance remains pending. Direct POST /mcp and a supported Sites verification-token attempt returned 401 with an auth challenge at the platform boundary. No token was logged or stored in files, and no bypass/workaround was attempted. Local handler and built-Worker tests pass; do not claim live native tool calls succeeded. Enable the installed plugin in the actual EA chat and test the two public tools. Private requests still require a compatible verified-owner auth flow. Backend stays version 7, existing grants unchanged, Site audience unchanged, PR draft/unmerged. No new costs.

### Owner control center (2026-11-08, PR #37)

Added one signed-in account overview with Needs you, Agent access and What happened views. Attention merges owner-private A2A questions with founder/builder next actions and opens the exact request/contribution. Access lists owner-scoped grants, capabilities, remaining requests, task limit, expiry and explicit revocation; inactive grants are collapsed. History loads up to 20 events for a selected authorized contribution and up to 10 denials from the account's bounded audit on demand. Summaries identify humans/agents without message bodies, credential values or grant IDs. Viewing never issues permissions or changes collaboration state.

Uses existing list/activity/agentAudit/revoke operations; no Supabase code, schema, permission or grant changes. Account sign-out/session loss clears center data; ticket/user/scope guards discard late history results. Preview labels its absent security audit clearly. Real and fictional controllers remain identical.

336 tests and 53-page static checks pass, including owner isolation, exact navigation, explicit-only revocation, safe audit summaries, no viewing mutation and late-response cleanup. Browser QA attempted; local browser use remains disabled and native service startup failed. Desktop/mobile visual acceptance unverified.

Published Sites version 31, saved version `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_2cc4a5f249048191bb14a3a636131ec7`, hosting source `8ff72e369797867edc32cbbd5d5c0b2bdae82733`, deployment `appgdep_6af0dfb5ce348191a58beb1fcdaf80c6` succeeded 2026-11-08T20:46:52Z with MCP retained. Four live JS/CSS assets match source exactly; real and fictional pages mount the component. Backend remains version 7, JIDOKA untouched, no new costs. PR draft/unmerged, stacked on #36.
