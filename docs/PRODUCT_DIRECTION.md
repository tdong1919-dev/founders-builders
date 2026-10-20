# Founders & Builders: living network, shared work

The home page is the visual and editorial foundation. Keep its warm off-white surfaces, graphite text, restrained indigo, sparing warm gold, IBM Plex Sans, rocket mark and quiet borders. `styles.css` owns design tokens; `brand-system.css` applies them to older prototype screens. Font files and their SIL Open Font License are in `assets/fonts`.

The central product story is **bring an idea → find contributors → build something together**. A living network gives people reasons to connect, context for a useful contribution, and a way to stay involved as the work changes. Introductions and recommendations support that journey. Do not lead with matching scores, swiping, a people database, or a catalogue of unrelated tools. Do not imply that automatic network learning or real shared accounts are live before they are implemented.

## Information hierarchy

Four primary destinations stay consistent across the site:

- **Build together:** public project opportunities and a route into shaping an idea.
- **People:** community members, their work and capabilities.
- **Community:** mentors, help, businesses, products/services, jobs, funding, events, chapters, podcasts, resources and supporting tools.
- **Workspace:** the place to plan and follow shared work; real member accounts remain deferred.

The home page gives two starting points: bring an idea or bring your strengths. It explains the progression from context to contribution to a small milestone. Supporting community features stay reachable without competing with that first decision. `community-vision.html` preserves the earlier broad vision and illustrative examples; it is not the primary onboarding experience.

## Implementation boundaries

The original Sheets/Apps Script public hubs remain intact. The private workspace remains disabled pending real auth and RLS verification. The fictional preview remains a separately labeled, in-memory entry point; it does not replace actual accounts or validate database security.

`navigation.js` owns shared menu behavior and has no storage, authentication, analytics or API behavior. `script.js` no longer injects extra top-level destinations. All branded pages load the same four-link navigation and common font stylesheet. Regenerate `workspace-preview.html` from `workspace.html` after markup changes.

## Verification and delivery

The local functional/security suites and shared navigation checks pass. All 41 HTML pages were checked for duplicate IDs, missing local stylesheet/script/link targets and consistent branding/navigation. Focused browser review covered the home page, Community and workspace at desktop and mobile widths. Shared mobile navigation opened and closed correctly; those screens had no horizontal overflow. Review corrected text alignment and heading spacing, and moved existing collaborations ahead of a collapsed project-creation form. Creating a private project succeeded in the isolated fictional preview. All 44 JavaScript tests passed. This review does not establish real authentication or database security; Supabase remains deferred. The follow-up review below covers the remaining supporting pages. Changes belong in a separate review PR stacked on the workspace PR, with no production merge or deployment.


## Learning through contribution

Anyone growing their skills, experience, or ideas belongs in the contributor path, whether they are starting out, changing direction, returning to work, or already experienced. The product does not need a separate audience-specific path or network. `learn-by-building.html` connects a small task, feedback, a supported account of the work, and continued relationships. The guide now includes a device-only contribution notebook, with explicit saving and manual portfolio-summary copying. It does not issue credentials or verify work histories; completed work remains self-reported. Starter tasks are examples to propose, not live opportunities. Reuse existing optional profile fields and backend contracts; do not require a company or startup stage from a learner.

## Supporting-page review · 20 October 2026

Content review covered all remaining public hubs, forms, tools, administration, and the archived vision. Rendered layout checks at 1280 × 900 and 390 × 844 covered these 37 pages: profiles, projects, business, calendar, collaborate, funding, help, jobs, marketplace, mentors, podcasts, resources, activity, chapters, concierge, dashboard, network, search, build-together, idea-match, create-profile, add-business, add-collab, add-event-source, add-event, add-help, add-investor, add-job, add-listing, add-podcast, add-raise, add-resource, become-mentor, report-listing, admin, community-vision, and the new learn-by-building guide (all `.html`). Home, Community, workspace, and workspace preview were covered in the preceding focused review.

No horizontal document overflow was found at those widths. Offscreen honeypot fields and the archived horizontal feature carousel are intentional; they are not document overflow. Representative screenshot review covered the guide (including its complete mobile page), People, calendar, dashboard, network, mentors, concierge, admin, and profile/collaboration forms. Browser interaction confirmed the guide-to-profile route and the calendar view switch. A populated calendar revealed that long event names could widen one column and clip the final day; seven `minmax(0,1fr)` tracks now keep all weekdays visible. Back links, kickers, headings, and tool-container insets were also corrected.

All 44 JavaScript tests passed; all 41 HTML pages passed duplicate-ID and local-target checks. No submission was made to a public form during this review. Public listings in the local browser displayed their existing sample-data labels; this is not validation of a live Sheets deployment. The Sheets/Apps Script JavaScript, form field names, authentication client, configuration, and SQL migrations were not changed. No hosted service was enabled, upgraded, or deployed. Supabase and real multi-user verification remain deferred.


## First-contribution flow · 20 October 2026

The learner route now has six starter tasks across testing, research, writing, design, code, and community work. Skill and time filters narrow a 45–90 minute first step; no task claims an open position, beginner support, or a member commitment. Existing public projects/help/events remain separate discovery routes. When live collaboration data is unavailable, the project page now points to the practical starter flow.

Selecting a starter fills a proposed deliverable and first conversation. The notebook supports up to 20 explicitly saved browser-local records, re-opening and updating a record, a draft introduction, a copyable plan, actual results/feedback, collaborator credit, and optional HTTPS evidence text. Nothing is sent or fetched by the new page (`connect-src 'none'` and `form-action 'none'`). User text is rendered with textContent, and evidence URLs are never embedded or fetched. Other public/backend code remains separate.

Portfolio previews and copying require a completed status, a described result, and an affirmative sharing-permission checkbox. Editing the record clears that permission and any generated output. Summaries identify themselves as self-reported and unverified. Storage failures preserve the in-memory form and do not report success. Replacing unsaved forms prompts the user; removing a saved record offers Undo until page departure. Records do not sync or provide authenticated access. Keep confidential founder ideas out of this notebook.

Verification for this addition: all 54 JavaScript tests pass, including filtering, result/permission gates, evidence URL validation, explicit saves, storage failures, hostile text rendering, permission reset after edits, corrupt storage, and remove/Undo. Browser review at desktop and mobile widths verified empty filters, prefilled plans, introduction drafts, persistence after reload, both portfolio gates, a permitted synthetic summary, and removal/Undo. The synthetic saved record was removed after the check. The page produced no browser warnings/errors during that review, and no real contact or publication occurred. All 41 HTML pages passed duplicate-ID and local-target checks.


## Founder small-task offers · 20 October 2026

`offer-task.html` completes the other side of the first-contribution path. Founders can start from a testing-task outline that only fills empty fields, then set a purpose, one deliverable, acceptance criteria, exclusions, a 30–180 minute estimate, starting knowledge, support, reviewer, feedback timing, compensation terms, and credit/portfolio agreement. The outline is a proposed scope, not a published opportunity. Links from projects, collaboration, the public posting form, and the learner flow make this reachable without expanding primary navigation.

Founders may save one browser-local task draft, remove it, or undo removal. Previewing a scoped brief does not publish it. Copying for sharing and handing it to the public collaboration form require public-detail permission. The latter uses a one-time same-tab session-storage payload (title and brief only) with a format marker and strict length/type checks. No task text travels in the URL; feedback and contributor details are excluded. The existing public form keeps current edits, never auto-submits, and asks the founder to review and enter contact information before posting. The existing Sheets/Apps Script submission contract is unchanged.

After delivery, a founder can prepare a feedback note containing actual reviewed work, a specific strength, a next step, and the contributor’s chosen credit. It requires reviewed-work and agreed-credit confirmations. It remains founder-authored feedback rather than a platform attestation, and must be shared manually. Editing clears old previews and sharing/review confirmations. The task builder itself blocks network connections and form navigation via CSP.

All 63 JavaScript tests pass. New checks cover scope completeness, bounded time, compensation, public-detail permission, feedback/credit gates, malformed or oversized handoffs, preservation of existing form edits, outline behavior, storage failures, and permission reset. Browser checks used synthetic data to verify local persistence, removal/Undo, both feedback gates, and a public-form draft with blank contact fields and no submission. The synthetic saved task was removed afterward. Mobile (390 × 844) and desktop (1280 × 900) reviews showed no horizontal document overflow. Live posting, actual founder/contributor agreement, and multi-user persistence remain unverified; Supabase stays deferred.


## Student discovery through feedback and credit · 20 October 2026

Project discovery now has scope and time filters. A complete published small-task brief is recognized from the existing collaboration description format; ordinary or incomplete posts remain ordinary collaborations. No backend columns or APIs are added. Demo, pending, private, closed, and other suppressed records are excluded from discovery. Cards show the time estimate, compensation, practice skill and support, with the full scope/feedback/credit brief available before interest is drafted. This is discovery of member-submitted listings, not verified availability. Unavailable live data is shown honestly without substituting fictional tasks.

Opening a scoped task passes a bounded, validated same-tab snapshot to the contribution notebook. Only task scope travels; founder feedback, personal contact information, completion and permissions do not. The import is one-time, removes its URL flag, and never saves or sends an expression of interest automatically. A founder can preview the same journey from an unpublished local draft; that snapshot is explicitly labeled “not published.” Task text stays out of URLs. The copied scope remains with an explicitly saved local contribution.

The notebook now shows a five-step journey and local progress choices: planning, interest drafted, scope agreed, in progress, awaiting feedback, and completed. Agreements and progress are self-reported. Students draft/copy interest and contact the owner through public discovery themselves. A feedback-and-credit request helps ask what was useful, what needs improvement, and what may be shown. Feedback received and agreed portfolio use can be recorded alongside results and collaborator credit. Portfolio summaries label those notes as contributor-recorded and remain gated by completion, actual results and sharing permission. No application inbox, role reservation, founder approval or credential is created. Existing local records retain compatibility.

The collaboration form previously treated an opaque no-cors response as proof that a post was live. It now reports only that the request was sent, preserves the visible draft, and prevents an accidental duplicate request. The Sheets/Apps Script request contract is unchanged. Live acceptance/publication still requires checking the public board; no public form was submitted during this work.

All 75 JavaScript tests pass. New tests cover round-trip founder brief parsing, multiline scope, malformed/duplicate labels, discovery filters and suppressed records, one-time safe handoffs, invalid/valid notebook imports, local progress, unverified feedback/credit text, and opaque submission responses. All 42 HTML pages pass duplicate-ID/local-target checks. Browser review exercised a fictional founder draft through interest, local progress, a feedback request, completed results, permission-gated portfolio preview and persistence. The synthetic saved contribution was removed. Desktop and mobile layouts had no document overflow; mobile discovery filters now stack at readable width. Asset version markers prevent stale discovery/notebook scripts from mixing with the new markup. The live public collaboration feed was unavailable in this browser; real availability, owner replies, feedback and publication remain unverified. Supabase and shared account workflows stay deferred; no production deployment or paid service was added.


## Founder interest review desk · 20 October 2026

`review-interest.html` connects student interest to founder review without suggesting that a shared inbox exists. A student prepares a minimal structured interest note in their notebook, explicitly permits sharing, and copies it for the intended founder. The note contains task/project, deliverable, original scope snapshot, chosen name, proposed contribution, availability, and questions. It omits notebook results, feedback, evidence links, history, completion and portfolio permissions. Copying never sends the note. Editing clears sharing permission and old output.

Founders paste the shared note into a local review desk. The parser uses a bounded, versioned whitelist and renders text without HTML or execution. Identity and task details remain unverified. The desk supports draft replies, clarification, task terms and feedback; its stages are local notes, not student notifications or reserved places. Up to 20 reviews can be explicitly saved, reopened, updated, removed and restored with Undo. Unsaved replacement prompts; storage errors do not claim success. No browser-local data is an authenticated private workspace.

A matching full task snapshot can fill empty scope fields as a starting point, without replacing founder edits or implying agreement. Ownership still needs explicit attention. Agreement drafts require the deliverable, acceptance criteria, exclusions, bounded time, compensation, support, reviewer, feedback timing, ownership and credit/portfolio terms. They remain proposals until the founder explicitly records direct confirmation with the contributor; that record is still not signed or platform-verified. Unresolved compensation cannot be labeled directly confirmed.

Feedback/credit notes require actual reviewed work, useful contributions, constructive feedback, a chosen credit name, permitted portfolio use and contributor agreement about sharing. Notes remain founder-authored and are copied/shared manually for contributor review. The platform does not issue a verified endorsement or automatically complete the student’s work. The existing student notebook can record received feedback and portfolio terms.

All 86 JavaScript tests pass, including packet minimization and permission, malformed/oversized inputs, task agreement gates, feedback credit gates, literal hostile-text rendering, explicit saves, storage failures, stale-confirmation reset, removal/Undo and matching-snapshot reuse. Browser review used a fictional student note through the sharing gate, founder import, response, task proposal, unresolved-compensation gate, reviewed-work/credit gates, save/reload and removal/Undo. The fictional saved review was removed afterward. No message or public form was sent. The page had no warnings/errors during review and no horizontal overflow at 1280 × 900 or 390 × 844. All 43 HTML pages passed duplicate-ID/local-target checks. Supabase, shared authentication, live inboxes and real agreement/identity verification remain deferred. No paid service, backend schema change, production merge or deployment was added.


## Student agreement review and received portfolio credit · 20 October 2026

Founders can now prepare bounded, versioned student return notes for proposed agreements and reviewed feedback. Agreement notes include only the recipient/task identity and task terms; they do not transfer the founder’s confirmation flag or private review notes. Feedback notes require the existing reviewed-work and agreed-sharing checks and omit unrelated founder notes and student history. Both are shared manually.

The student notebook now lets a student paste and preview a received note. Task, project and chosen name must match the open record, but matching text is not proof of the sender’s identity. Imports remain visibly unverified. Adding a note requires explicit acknowledgment and does not save automatically. A proposed agreement updates the deliverable and returns unfinished work to planning, without inferring agreement; a changed scope cannot silently replace completed work. The student can draft questions or, after reviewing scope/time/compensation/support/ownership/credit terms, draft an exact confirmation. Unresolved compensation blocks confirmation. Neither draft is sent or signed, and neither advances progress automatically.

Received feedback is kept as a separate source snapshot with the record. It preserves the student’s own result, reflection and progress, updates portfolio-use terms explicitly, and always clears portfolio sharing permission. Portfolio output still requires completed work, an actual result and separate permission. Received feedback and credit are included as unverified source notes rather than a platform endorsement. Identity changes that no longer match a saved received note block portfolio output until clarified or removed. Students can clear a received source from the unsaved form and save deliberately. Transient review acknowledgments and confirmation choices are not imported or persisted.

All 95 JavaScript tests pass. New checks cover minimized return exports, malformed/oversized/wrongly typed returns, task/project/recipient mismatches, acknowledgment gates, scope changes to completed work, compensation and confirmation gates, preservation of personal notes, separate portfolio permission, and received-source validation in portfolio output. The browser walkthrough used fictional founder agreement/feedback notes through recipient mismatch, explicit review, confirmation/question drafting, feedback addition, completion/portfolio gates, save/reload and removal. The fictional saved contribution was removed afterward. Desktop (1280 × 900) and mobile (390 × 844) review showed no document overflow, and browser warnings/errors were empty during the focused review. Changed runtime scripts use content-based version markers to avoid mixing cached old code with new markup. All 43 HTML pages passed structural checks.

No messages, agreements, feedback, credit or portfolios were sent, signed or published. Existing Sheets/Apps Script behavior and private auth/database code are unchanged in this addition. This remains a device-only/manual exchange until Supabase and shared authentication are configured and verified. No paid service or production deployment was added.


## Audience and wording · 20 October 2026

Use **contributor**, **builder**, or **anyone growing skills and experience** in the product. The experience-building path is not tied to enrollment, age, or career stage. Home, People, profile creation, founder task offers, interest review, return notes, status messages, confirmation drafts and chapter focus copy now follow that direction. Educational status is neither required nor used to gate these flows.

Existing internal element identifiers and the `fb-student-interest-v1` packet marker remain compatible with earlier saved/shared notes; they are implementation details, not audience restrictions. No task, agreement, feedback, permission or authentication logic changed in this wording pass. All 95 existing tests pass.


## Guided next contribution step · 20 October 2026

The contribution notebook now offers one contextual next action above its fields. Guidance follows local progress and missing essentials: shape a task, prepare interest, review founder terms, plan delivery/check-ins, request feedback, record an actual result, review credit/sharing, then prepare the portfolio preview. It welcomes anyone growing skills and experience.

The action only opens the relevant section and focuses the field or existing button. It does not advance progress, generate/copy a message, save a record, grant sharing permission, or validate a received agreement. Existing portfolio validation remains authoritative. Clearing a received source refreshes the guidance.

All 97 JavaScript tests pass. New checks cover stage guidance, result and sharing prerequisites, and opening/focusing a collapsed section without saving or changing progress. A fictional unsaved browser walkthrough checked interest, feedback, result and credit actions; reloading cleared the fixture. Screenshots at 390 and 1280 pixels showed readable guidance without horizontal document overflow. All HTML pages passed duplicate-ID/local-target checks; changed scripts and diff whitespace checks passed. Sheets/Apps Script, authentication and database code are unchanged. Supabase remains deferred; no production deployment or paid service was added.


## Portable contribution notebook · 20 October 2026

The notebook sidebar now has a collapsed backup/restore tool. Preparing a backup exposes only explicitly saved records as copyable text; unsaved form edits are excluded. The tool explains that the copy includes personal plans, notes and received sources and should be kept privately, separately from a public portfolio. No upload, sync, download service or network connection is added.

Restore accepts a bounded, versioned record whitelist, validates progress, evidence and received source identity/type, and previews task titles/stages as literal text. A separate acknowledgment is required. Restore appends new records with fresh local IDs, skips identical normalized copies, refuses additions beyond the 20-record limit, and preserves existing records and the open form. Sharing permission is always cleared on imported records. Progress and received sources remain self-reported/unverified. A failed storage write leaves in-memory records and the open form unchanged. Editing the pasted backup invalidates review; restore revalidates current capacity and contents. Generated copies cannot exceed the restore size limit.

A related next-step refresh fix clears sharing permission before computing guidance after an edit, so a completed record immediately returns to the credit/sharing step.

All 105 JavaScript tests pass. New coverage includes backup round trips, source preservation/mismatch rejection, IDs/permissions exclusion, malformed/oversized inputs, deduplication, capacity, literal hostile text, explicit review, stale review, storage failures and open-form preservation. A fictional browser backup was reviewed, restored with acknowledgment, exported and checked for fresh sharing permission; duplicate review skipped it and unsaved work remained intact. The fictional saved record was removed, and reload left an empty notebook. Mobile (390 pixels) and desktop (1280 pixels) screenshots showed readable controls with no horizontal document overflow. All HTML pages passed duplicate-ID/local-target checks; script syntax and diff whitespace checks passed.

Sheets/Apps Script, authentication and database code remain unchanged. Supabase remains deferred; no paid service, production merge or deployment was added.


## Simpler contribution plan · 20 October 2026

The notebook now presents the task title, project, deliverable, chosen name and local progress as its core plan. Save and Copy the plan sit immediately below those fields. Optional skill, collaborator and check-in details live in an expandable section, and the original task snapshot follows the core instead of preceding it. Introduction drafting/copying tools are grouped inside the interest section. Existing agreement, feedback and portfolio tools remain available. Saving still includes the entire form, including collapsed sections. No fields, storage formats or behavior contracts changed.

All 105 existing tests pass. Structural checks confirm preserved notebook IDs, named fields and required inputs, one Save submit button, and valid local targets/unique IDs across every HTML page. A fictional browser walkthrough verified next-step guidance opening the optional check-in section, saving while that section was closed, restoring its contents after reload and drafting an introduction from the relocated tools. The fictional saved contribution was removed afterward. Mobile (390 pixels) and desktop (1280 pixels) screenshots showed readable fields and controls with no horizontal document overflow. No public message, form submission, paid service or production deployment occurred. Sheets/Apps Script and private authentication/database code are unchanged; Supabase remains deferred.


## Founder essentials and guided review · 20 October 2026

The founder task builder now leads with a short essentials section covering deliverable, time, support, compensation and credit. Completion criteria and review details are expandable but still required before sharing. Readiness and focused missing-field repair preserve all validation and public-detail permission gates. Save is available before the advanced details and can retain an unfinished draft.

The review desk now has stage-based next-step guidance and direct Clarify interest / Propose terms / Give feedback actions. They open the relevant step without changing local stages or confirmations. Contributor/task identity is immediately visible; the full context is expandable. Save sits near the stage selector, and structured notebook-note labels/instructions clarify the return handoff.

A complete local browser walkthrough reached portfolio credit and caught a premature first-interest guidance issue, now fixed and regression-tested. All 110 tests pass, including a new public-discovery-fixture integration journey. Both founder pages passed mobile/desktop layout review and strict structural checks. See [the walkthrough](FOUNDER_CONTRIBUTOR_WALKTHROUGH.md) for steps, gates, cleanup and the live-feed limitation. All fictional saved test records were removed. Supabase remains deferred; no backend contract, authentication, SQL, paid service or production deployment changed.


## Finding saved founder reviews · 20 October 2026

The founder review desk now searches saved contributor names, task titles and projects, and filters saved stages, including an open-only view. A visible shown/total count, human-readable stage labels, no-match guidance and Clear filters keep the list understandable. Filters use saved copies; saving a changed stage updates the list. A filtered-out selected review stays open with a notice, preserving unsaved edits and confirmations. Filtering never writes storage, contacts contributors, advances stages, or resets the open form. The unopened workspace now explains how to choose a saved conversation or bring a shared interest.

All 113 JavaScript tests pass. New checks cover search/stage combinations, closed/open separation, no-match and clearing behavior, preservation of unsaved work and confirmation flags without writes, and the unopened/open workspace state. A browser walkthrough used two fictional saved reviews to check case-insensitive project search, stage filtering, hidden-selection notice, unchanged unsaved reply, and Clear filters. Both fictional reviews were removed and reload showed zero saved reviews. Phone (390 pixels) and desktop (1280 pixels) checks showed no horizontal document overflow. HTML ID/local-target checks, changed-script syntax and diff whitespace checks pass.

Sheets/Apps Script, authentication and database behavior are unchanged. Supabase remains deferred; no paid service or production deployment was added.
