# Contribution journey release review — 21 October 2026

Production is unchanged. Supabase remains disabled and deferred. No paid services or public submissions were added.

## Requested checks

| Check | Evidence and status |
| --- | --- |
| Desktop/mobile visual review | **Pending.** Browser inventory returned no browsers; opening an in-app review tab failed with `Browser is not available: iab`. Shared responsive styles were inspected. Links to collapsed steps now open their ancestors and scroll below the fixed navigation. This is not rendered visual verification. |
| Fictional task in the actual interface | **Pending.** A new test exercises both actual page controllers through their button/form handlers with fictional data and in-memory DOM/storage substitutes. This is not a browser walkthrough. Earlier browser evidence in `FOUNDER_CONTRIBUTOR_WALKTHROUGH.md` does not validate this revision. |
| Simplify repetitive handoffs | **Implemented.** Completed interest details lead to reviewing/sharing the interest note, rather than prematurely requesting founder terms. Missing contribution text gets its own focus target. Note labels explain which person receives each and where to paste it. Walkthrough stage links name actions. Direct links reveal collapsed received-note sections. Formats and local storage contracts remain compatible. |
| Frontend release review and isolated Google runtime | **Code review/checks completed; release blocked.** The isolated Google runner in PR #9 has not run in Google. No browser or callable Apps Script execution capability is available in this session. |

## Verification

- **132 frontend tests pass**, including a two-controller walkthrough and linked-step navigation regression. The walkthrough checks explicit interest sharing, proposal, contributor acknowledgment, confirmation draft, feedback request, actual-work/credit gates, matching feedback, preserved contributor results, completion/portfolio permission gates, and explicit saving on both sides. No real network, clipboard access, public submission, or automatic save is used.
- **145 tests pass in a disposable combined source tree** containing this frontend plus backend PR #9. This verifies proposed compatibility without merging branches or touching production; Google APIs remain mocked.
- All **44 HTML pages** pass local asset/link/anchor and duplicate-ID checks. Changed JavaScript passes syntax checks; the diff passes whitespace checks. Changed CSS/notebook asset references are refreshed on the journey pages.
- Source review confirms disabled Supabase settings with empty URL/key. Local note tools retain network/form restrictions, explicit acknowledgments, literal text rendering, and separate portfolio permission. No service-role key was added. The Sheets endpoint configuration is unchanged.

## Local follow-up while Google login is unavailable

The notebook, founder review desk, and task builder now register a standard browser unsaved-edit warning. It activates after form edits/imports/outlines and clears only when the form is saved successfully or explicitly reset. Failed saves retain protection. It never uploads or automatically saves contents; browser support for the prompt, especially on mobile, still needs real-browser verification. The warning does not guarantee recovery after a browser/process crash.

Portfolio generation now requires recorded credit/portfolio-use terms in addition to completed work, an actual result and separate permission. This closes a direct-button bypass of the existing next-step guidance. Existing saved records remain readable; add terms before generating a new summary.

Reproduce checks with `node --test tests/*.test.cjs`, `python3 scripts/check-static-pages.py`, and `git diff --check`.

## Downloadable handoff notes

Contributors can download a minimized interest JSON note after permission is checked. Founders import it into the review desk and open it for review, then download an agreement or feedback JSON note for the contributor. Contributors import return files into the matching notebook record and still preview, acknowledge, and explicitly add them. Copy/paste remains available. The public walkthrough explains both routes.

File reads remain local. Imports use existing format/field/recipient validators, reject incorrect formats and oversized or unreadable files, discard undeclared fields, and retain the existing input on failure. No file is uploaded, auto-saved, or treated as verified identity, acceptance or credit. Failed imports and pending imports clear earlier acknowledgment/preview state. A late read cannot replace a newer selection, manual text edits or a changed notebook record. Generic download filenames exclude names and project titles; temporary blob URLs are revoked. The file picker is constrained for narrow panels in shared CSS, but its rendered desktop/mobile behavior is unverified.

The two-controller journey now downloads actual JSON blobs, imports them through the file-input handlers, and follows the existing proposal/feedback/portfolio gates. Tests also verify consent prevents interest downloads, review/credit checks prevent feedback downloads, parsing preserves the legacy packets, malformed/oversized/wrong-recipient handling, stale async reads, field minimization and blob cleanup.

A fresh browser inventory still returned no browsers; the desktop/mobile walkthrough cannot run. No callable Google Apps Script executor is exposed, and Google login cannot be completed while the user is remote. The guarded runtime runner remains ready in #9; no test workbook or Google execution is claimed. No production changes occurred.

## PR dependencies and release decision

- **#7** targets `main` with the inactive Supabase foundation. Activation remains blocked on hosted JWT/RLS/email and authenticated UI checks.
- **#8** targets #7's branch with the living-network frontend. It remains draft. The configured deployment previously rejected `collab`; live discovery is unverified.
- **#10** targets #8's branch with the walkthrough and these refinements. It remains draft pending visual review and an actual-interface replay.
- **#9** also targets #8's branch, independently of #10. It contains the Sheets boundary fix and isolated Google runner. Google literal-formula readback, permissions, and HTTP deployment behavior remain unverified. Review public email fields and legacy blank-status rows before deployment.

GitHub reported all four PRs mergeable during metadata review. Mergeability is not release approval. No merges, deployments, permission changes, or Supabase activation were performed.

## Remaining execution when the browser is available

1. Render the home page, task builder, discovery, walkthrough, notebook, and founder desk at 390px and 1280px. Inspect branding, wrapping, button reachability, linked-step visibility, focus, and overflow.
2. Replay the fictional journey through actual controls, including denied clipboard access, saved-record reload, wrong-recipient rejection, and feedback/portfolio permission gates. Remove only records created for this replay.
3. Run `verifyPublicBoundaryInGoogle` from PR #9 in a new empty bound test workbook, following `APPS_SCRIPT_PUBLIC_BOUNDARY.md`. Review new Google authorization scopes before approval. Never install the runner into production.
4. Verify staging HTTP behavior and publication permissions separately before considering release and an intentionally public, owner-approved task. Keep live discovery restoration blocked until these checks pass.
