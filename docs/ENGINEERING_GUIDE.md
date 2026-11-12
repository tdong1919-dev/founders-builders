# Engineering guide

This is a map of the existing implementation, not a claim that every subsystem is production-accepted. Read the [reviewer guide](REVIEWER_GUIDE.md) and [roadmap](../ROADMAP.md) alongside dated evidence. Crystal leads product direction; development is AI-assisted, as disclosed in the reviewer guide.

## Repository map

| Location | Responsibility | Review boundary |
| --- | --- | --- |
| Root `*.html`, `*.css`, `*.js` | Static pages, reusable browser modules, styles, fictional examples, and cloud UI clients. | Existing URL/module paths are intentional. Browser state is not server authorization. |
| `collaboration-core.js`, `*-kit.js` | Contribution state transitions and focused domain helpers. | Review roles, versions, denied paths, and synthetic fixtures with related tests. |
| `supabase/functions/fb-collaboration/` | Authenticated collaboration handler, owner permissions, scoped MCP, limited A2A, and notification delivery implementation. | Implementation does not establish deployment or permission to enable notifications. |
| `supabase/functions/fb-beta-access/` | Approval-based beta-access requests and review handler. | Keep approval controls intact. |
| `supabase/migrations/` and `supabase/tests/` | Versioned database/RLS changes and security checks. | SQL files in Git are not proof that a migration is applied. Never apply them merely to review this project. |
| `server/` | Loopback-only persistent fictional collaboration service. | Requires Node.js with `node:sqlite`; synthetic sessions are not production authentication. |
| `sandbox/` | Review Worker builder, public projection, discovery adapter, and hosted checks. | Build only reviewed assets; do not deploy the entire source tree. |
| `scripts/` | Static-page checks, metadata/preview generation, and separately authorized verification tools. | Read each script's scope before running it; hosted/recovery scripts can require service access. |
| `tests/` | Automated domain, authorization, protocol, navigation, and regression checks. | Passing fixtures are distinct from browser, live-provider, and real-agent-host acceptance. |
| `apps-script/` | Retained legacy Sheets integration. | Submissions stay disabled; not the current collaboration system. |
| `assets/` | Branding and bundled fonts with their notices. | Preserve [font licensing](../assets/fonts/OFL.txt); no root source-license grant is implied. |
| `seed-content/` | Editorial intake guidance and templates. | Templates are not real participants, opportunities, or adoption evidence. |
| `docs/` and dated root records | Architecture, guides, decisions, and release evidence. | Dates and intended revisions matter; historical instructions can be superseded. |
| `.well-known/`, agent JSON/client files | Discovery and connection descriptors/examples. | Advertising a protocol does not prove compatibility with an external host. |

The current frontend deliberately has no bundler requirement. This documentation pass preserves runtime paths, folders, tests, and deployment behavior. Any later module/folder refactor should have a dedicated PR, asset-link checks, and browser regression evidence.

## Trust and data flow

1. Human browser or explicitly authorized agent requests an action.
2. Server-side identity, beta approval, participant ownership, and task permissions constrain private operations.
3. Private collaboration state stays separate from owner-approved public-card projections.
4. Public discovery exposes only its approved projection; connecting an agent does not start an unrestricted executor.
5. Agreements, grants, reviews, and portfolio sharing retain current human controls. Compensation happens directly between participants.

Do not put server keys, agent grants, private messages, production attachments, customer exports, backups, recovery material, or sign-in links in public source, issues, screenshots, or the Project. A browser publishable key is not a server secret and is not a substitute for authorization.

## Change and release discipline

Use focused PRs with the user problem, resulting behavior, affected boundary, validation, and remaining limits. [Contributing](../CONTRIBUTING.md) lists local commands. UI changes need representative desktop/mobile and keyboard evidence; permission changes need denied-path and isolation coverage. Hosted acceptance needs its own authorization and dated receipts.

| Word | Required basis |
| --- | --- |
| Built | Implementation present at a named source revision. |
| Tested | Named checks passed in a stated environment at a recorded time. |
| Merged | GitHub records inclusion on the target branch, or consolidation is explicitly demonstrated. |
| Deployed | Provider/release evidence identifies the hosted revision and affected component. |
| Accepted | The checkpoint's explicit exit criteria have supporting evidence. |

Earlier stacked work entered `main` through [PR #59](https://github.com/tdong1919-dev/founders-builders/pull/59). Consult the [stack inventory](../PR-STACK-INVENTORY.md): closed does not mean individually merged. [PR #63](https://github.com/tdong1919-dev/founders-builders/pull/63) and [#68](https://github.com/tdong1919-dev/founders-builders/pull/68) were still open at the November 12 review and are not accepted by this documentation pass.

Frontend hosting, Edge Functions, and database migrations have separate lifecycles. A documentation merge is not a production release. Collaboration emails and legacy Sheets submissions remain off. Web3 is exploratory; there are no implemented tokens, wallets, blockchain, escrow, or platform payment processing.
