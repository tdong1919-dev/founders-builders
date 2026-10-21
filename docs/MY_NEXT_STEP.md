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

All 153 frontend tests pass. New coverage checks stage-appropriate actions, finished-work filtering, literal text rendering, one action per card, minimized session pointers, no automatic record writes, blocked storage, malformed records, refresh/history/cross-tab behavior and stale or wrong-tool pointers. Waiting-state tests check explicit stage save/reopen, backup preservation, open-review filtering, follow-up actions and unchanged download/credit gates. Actual notebook/review controller tests verify resuming the right record, current-action focus, opening feedback, prefilled saved proposals, unchanged stages and separate review/credit acknowledgment.

All 45 HTML pages pass local asset/link/anchor and unique-ID checks using `python3 scripts/check-static-pages.py`. Changed JavaScript syntax and diff whitespace checks pass. Desktop/mobile rendering and actual browser focus behavior remain unverified because browser automation is unavailable. No Google runtime test, production deployment or paid service was added. Supabase remains deferred.
