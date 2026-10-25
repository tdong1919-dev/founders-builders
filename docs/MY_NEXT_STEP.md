# My next step

The local action board at `my-next-step.html` reads saved contributions and founder reviews on this device. It is linked from the home page, project discovery, contribution notebook, founder review desk, and task builder. The shared homepage typography, surfaces, colors and responsive navigation carry over.

Each task has one action, using the existing contribution/review guidance: prepare or share interest, review terms, plan delivery/check-ins, request feedback, or give feedback and credit. The board does not infer that a note was sent, an agreement accepted, work delivered or a response received. Stages remain self-reported local notes. Completed contributions and closed founder reviews are hidden by default and can be included with one checkbox.

## Record handoff

An action stores only `{kind,id}` in a one-time, same-tab session pointer. The URL contains `next-step=1`, with no task title, project, name, note text or record ID. The destination reloads the saved record, recalculates its next action from current data, opens the relevant collapsed section and focuses its control. The pointer cannot supply a focus target or bypass consent. No record is saved, progress changed, or sharing performed. A saved proposal is prefilled for explicit review; acknowledgment and terms-review checkboxes remain clear.

Missing, removed, malformed or wrong-tool pointers show recovery guidance. If session storage is unavailable, the board keeps the user on the page and offers the normal tool links. It never navigates with record contents as a fallback.

## Explicit waiting states

Use the progress/stage selector in the notebook or founder desk, then save after acting directly:

| Tool | Saved state | Next action |
| --- | --- | --- |
| Contribution notebook | Interest shared → waiting for a founder’s reply | Review the founder’s reply when it arrives; do not prompt another interest share. |
| Founder desk | Terms proposed → waiting for confirmation | Review proposed terms and questions without treating the proposal as accepted. |
| Contribution notebook | Work delivered → waiting for feedback | Plan a feedback check-in; review a saved feedback note if one is present. |
| Founder desk | Feedback shared → ready to close the loop | Plan the closing conversation, then explicitly choose Closed and save when finished. |

Copying, downloading, previewing, importing and opening a task never set these states. A stage is the user's local record, not a delivery receipt, a notification or evidence of acceptance/completion. Waiting tasks remain active on the board. Existing stages remain supported, including the legacy self-reported awaiting-feedback stage. New stages survive reload, filters and backups; exported/restored confirmation and permission flags are still cleared. No packet formats or storage keys changed.

A saved feedback source changes the suggested action to review that note, without marking the work completed. Both the notebook's next-action control and the board handoff prefill the appropriate saved source for explicit review. A newly pasted note is preserved. Received notes, portfolio permission, actual work and final completion remain separate decisions.

## Saved work and privacy

The board validates each saved item using the existing portable-record validators. Invalid records are skipped with a notice; valid records from either source remain available. A blocked or corrupt store does not break the other source, and no saved data is repaired or overwritten. Reads are bounded to the existing 20-record/1.5-million-character limits. User-provided titles, project names and chosen names render as literal text. Full note bodies, agreement terms and feedback are not rendered on the board.

The page blocks network connections and form submissions through CSP. It has no API calls, analytics, inbox, authentication or sync. Browser storage is not an authenticated shared workspace; use non-confidential descriptions. Refresh, browser history return and relevant cross-tab storage events update the view without writing records or moving focus. A local stage change appears after it is explicitly saved in its original tool.

## Bug fixes from the waiting-state test pass

- Valid founder notes between 16,001 and 18,000 characters no longer get truncated in notebook normalization or rejected by backup. Snapshot limits now match the receiving parser's 18,000-character bound, including readonly source fields.
- The notebook, founder desk and board use the same bounded saved-record loader. One malformed founder review no longer hides valid reviews. Legacy records without a stage keep the previous Planning/Reviewing defaults. Existing local confirmation flags remain local; backup exports/restores continue to clear them.
- If saved data is malformed or only partly readable, a persistent notice explains that valid records can still be reviewed/copied. Saving, removing, undoing and restoring are blocked for that store so unreadable original data is not silently overwritten. This protects data; it does not repair damaged data. Existing backups can be reviewed and valid notes copied for recovery in a clean browser store.
- Interest and return-note exports now reject serialized content larger than the recipient accepts. Structured notes use compact JSON so formatting whitespace does not turn an otherwise valid note into an unimportable one. Readable text previews remain available separately.

Regression tests reproduce the original truncation and partial-corruption failures, verify long source backup round trips and untouched stores during blocked save/remove/restore, and reject oversized generated notes before sharing. No actual user records were inspected or altered during these tests.

## Verification

All 175 frontend tests pass. New coverage checks stage-appropriate actions, finished-work filtering, literal text rendering, one action per card, minimized session pointers, no automatic record writes, blocked storage, malformed records, refresh/history/cross-tab behavior and stale or wrong-tool pointers. Waiting-state tests check explicit stage save/reopen, backup preservation, open-review filtering, follow-up actions and unchanged download/credit gates. Actual notebook/review controller tests verify resuming the right record, current-action focus, opening feedback, prefilled saved proposals, unchanged stages and separate review/credit acknowledgment.

All 45 HTML pages pass local asset/link/anchor and unique-ID checks using `python3 scripts/check-static-pages.py`. Changed JavaScript syntax and diff whitespace checks pass. Desktop/mobile rendering and actual browser focus behavior remain unverified because browser automation is unavailable. No Google runtime test, production deployment or paid service was added. Supabase remains deferred.

## Stale-tab protection

The contribution notebook, founder review desk and founder task builder capture the original saved value when opened. Before an explicit save, removal, restore or undo, they compare it with the current saved value. If another tab has changed it, the write is blocked and a persistent notice explains how to copy unsaved notes before reloading. Open forms, consent choices and newer saved records are not replaced. Successful operations update the local baseline; failed storage operations leave it intact so a later retry is possible.

Regression tests exercise stale saves, removals, backup restores and undo in the actual page controllers, plus repeated successful writes and failed-write retries in the shared storage adapter. The fixtures now model real storage updates rather than returning the initial value forever.

This detects changes visible immediately before writing. It is not a transactional database lock and cannot guarantee resolution of simultaneous writes from independent browser contexts. Real cross-tab/browser behavior still needs a rendered walkthrough. It adds no network calls, sync or database dependency; all database work remains deferred.

## Compensation wording

The founder/contributor journey, public opportunity pages, and generated briefs/agreement text explain that compensation is agreed directly between the project owner and contributor. Project owners are responsible for their offers; the platform does not set rates, process payments, guarantee payment, or resolve payment disputes. Paid, unpaid/voluntary and terms-to-discuss options remain available, with existing stored/API values and pre-start agreement requirements preserved. Feedback and portfolio credit are explicitly separate from compensation. Reporting remains available for misleading listings or misconduct without promising payment recovery or dispute resolution. This copy describes platform behavior; it does not claim a legal exemption or change any backend/payment feature.

## First-use guidance

A new, empty board offers two paths: plan a first contribution or prepare a founder task. Existing finished work shows a clear-list message instead, while failed storage reads show recovery guidance instead of first-visit onboarding. These choices add no records, account requirement or remembered onboarding flag. Original-tool links remain available in every state. Task action buttons include the task title in their accessible name so repeated actions are distinguishable to assistive technology.

An interest draft without a project name now focuses the project field before suggesting sharing, avoiding a predictable validation dead end. Already-shared interest retains its waiting state. Tests verify first-visit visibility, finished/unavailable states, task-specific button labels and missing-project focus without saving or advancing progress. Desktop/mobile rendering and assistive-technology behavior still need real-browser review. All database work remains deferred.

## Relationship follow-up drafts

The notebook's existing check-in section offers optional draft/copy controls while interest is shared or work is delivered. The draft asks for a next step or feedback without asserting an overdue deadline, guaranteeing an outcome or embedding private results, scope, feedback history or credit terms. Use the timing and channel agreed directly with the other person; no reminders are scheduled.

The founder desk offers an optional closing-conversation draft after feedback is explicitly marked shared. It invites questions and a discussion about staying in touch. It does not close the review, verify work, grant portfolio permission or alter compensation. The user still chooses the Closed stage and saves when appropriate.

Both controls live inside existing expandable sections. Preparing or copying a draft does not save, send, or change a stage. Stage guards remain active even if a hidden control is invoked. New tests cover draft minimization, appropriate stage visibility, unchanged progress/permissions, rejection outside waiting/feedback-shared stages, and exclusion of private note history. Rendered browser behavior remains unverified. No database or external messaging service is involved.

## Completed work and portfolio review

Completed contributions have a separate collapsed section below the active list. Each offers one next action based on what is missing: record the actual result, check credit/sharing terms, or open the existing portfolio preview control. Private results, feedback, scope, evidence and credit terms are not shown on the board. Opening a completed record focuses the appropriate control without generating, saving, publishing or verifying a summary. Existing completion, result, credit-term and permission checks remain in the notebook.

The optional Include finished work filter moves completed cards into the main list and hides the separate section, avoiding duplicates. Closed founder reviews remain available through that filter. First-use, finished-only and unavailable-data messages stay distinct. Tests cover readiness actions, private-text exclusion, filter transitions without writes, minimized handoff pointers and destination focus without automatic output. Real browser review remains pending; database work stays deferred.

## Find saved work

One local search field filters task titles, project names, collaborator/chosen names and displayed stages. Words can appear in any order, matching is case-insensitive, and the query is bounded to 160 characters. Personal results, feedback, evidence, scope, agreement bodies and credit terms are not searched. Contribution collaborator names now appear as local card context, alongside existing founder-review chosen names.

The search applies to active and completed sections, retaining the no-duplicate finished-work behavior. Counts distinguish matches from the total view; messages distinguish no active matches from completed matches below. Queries survive refresh/history/cross-tab updates and finished-work toggling but are not saved, sent or put into URLs. Clear search restores the view and focuses the field. Search is disabled when no readable saved work is available, and first-use/recovery guidance remains intact.

Tests cover metadata-only matching, multi-word/case/query limits, local filtering without fresh storage reads, preserved queries, no-match and clear behavior, completed-only matches and no record writes or navigation during search. Real-browser review remains pending. No database or deployment changes were made.

## Attention before waiting

The board puts actionable tasks first, waiting tasks next, and optional finished work last. It keeps saved order within each group without writing or reordering stored records. Counts show tasks ready for attention and tasks waiting overall, even during search. Waiting cards retain one appropriate review or check-in action. No deadlines or overdue claims are inferred.

Only explicit interest-shared, work-delivered and terms-proposed actions are waiting. A saved proposal or feedback source that needs review returns a contribution to the attention group; an incomplete brief also takes precedence. Feedback shared remains actionable so the founder can close the conversation. Tests cover ordering, stable records, waiting-only counts, search counts, received-note precedence and incomplete briefs.

## Focus on attention

Attention only temporarily hides waiting and finished work. The finished-work checkbox is disabled while focused, retaining its previous choice for when focus is turned off. Search and refresh preserve the current focus. Empty guidance explains how to return to waiting work without treating it as a first visit or claiming damaged storage is clear. No filters are persisted and no records, stages or permissions change. Tests cover combined filters, refresh, restoring finished-work choices, empty/search/recovery states and no writes.
