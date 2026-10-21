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

- **125 frontend tests pass**, including a two-controller walkthrough and linked-step navigation regression. The walkthrough checks explicit interest sharing, proposal, contributor acknowledgment, confirmation draft, feedback request, actual-work/credit gates, matching feedback, preserved contributor results, completion/portfolio permission gates, and explicit saving on both sides. No real network, clipboard access, public submission, or automatic save is used.
- **138 tests pass in a disposable combined source tree** containing this frontend plus backend PR #9. This verifies proposed compatibility without merging branches or touching production; Google APIs remain mocked.
- All **44 HTML pages** pass local asset/link/anchor and duplicate-ID checks. Changed JavaScript passes syntax checks; the diff passes whitespace checks. Changed CSS/notebook asset references are refreshed on the journey pages.
- Source review confirms disabled Supabase settings with empty URL/key. Local note tools retain network/form restrictions, explicit acknowledgments, literal text rendering, and separate portfolio permission. No service-role key was added. The Sheets endpoint configuration is unchanged.

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
