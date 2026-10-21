# My next step

The local action board at `my-next-step.html` reads saved contributions and founder reviews on this device. It is linked from the home page, project discovery, contribution notebook, founder review desk, and task builder. The shared homepage typography, surfaces, colors and responsive navigation carry over.

Each task has one action, using the existing contribution/review guidance: prepare or share interest, review terms, plan delivery/check-ins, request feedback, or give feedback and credit. The board does not infer that a note was sent, an agreement accepted, work delivered or a response received. Stages remain self-reported local notes. Completed contributions and closed founder reviews are hidden by default and can be included with one checkbox.

## Record handoff

An action stores only `{kind,id}` in a one-time, same-tab session pointer. The URL contains `next-step=1`, with no task title, project, name, note text or record ID. The destination reloads the saved record, recalculates its next action from current data, opens the relevant collapsed section and focuses its control. The pointer cannot supply a focus target or bypass consent. No record is saved, progress changed, or sharing performed. A saved proposal is prefilled for explicit review; acknowledgment and terms-review checkboxes remain clear.

Missing, removed, malformed or wrong-tool pointers show recovery guidance. If session storage is unavailable, the board keeps the user on the page and offers the normal tool links. It never navigates with record contents as a fallback.

## Saved work and privacy

The board validates each saved item using the existing portable-record validators. Invalid records are skipped with a notice; valid records from either source remain available. A blocked or corrupt store does not break the other source, and no saved data is repaired or overwritten. Reads are bounded to the existing 20-record/1.5-million-character limits. User-provided titles, project names and chosen names render as literal text. Full note bodies, agreement terms and feedback are not rendered on the board.

The page blocks network connections and form submissions through CSP. It has no API calls, analytics, inbox, authentication or sync. Browser storage is not an authenticated shared workspace; use non-confidential descriptions. Refresh, browser history return and relevant cross-tab storage events update the view without writing records or moving focus. A local stage change appears after it is explicitly saved in its original tool.

## Verification

All 142 frontend tests pass. New coverage checks stage-appropriate actions, finished-work filtering, literal text rendering, one action per card, minimized session pointers, no automatic record writes, blocked storage, malformed records, refresh/history/cross-tab behavior and stale or wrong-tool pointers. Actual notebook/review controller tests verify resuming the right record, current-action focus, opening feedback, prefilled saved proposals, unchanged stages and separate review/credit acknowledgment.

All 45 HTML pages pass local asset/link/anchor and unique-ID checks using `python3 scripts/check-static-pages.py`. Changed JavaScript syntax and diff whitespace checks pass. Desktop/mobile rendering and actual browser focus behavior remain unverified because browser automation is unavailable. No Google runtime test, production deployment or paid service was added. Supabase remains deferred.
