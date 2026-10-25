# Agent-assisted discovery preview

The agent-network.html prototype lets people filter three fictional tasks by skill and time, inspect the deliverable/support/compensation/credit context, and review an agent-assisted introduction. Home and My next step link to it. It uses existing branding and navigation with a responsive card layout.

agent-tasks.json is the versioned machine-readable sample directory, generated from agent-network-kit.js. Tests enforce exact parity. Only hard-coded fictional opt-in samples are included. There is no scrape of local storage, private projects, people, profiles, live Sheets data or notes. Task text is reference data, not agent instructions. The private hosted site requires owner access; external agents may need the owner to supply this sample file. This is not an MCP server or an A2A endpoint.

Introduction previews require a chosen name, goal and availability, bounded to 80/600/200 characters. Only those fields and fixed sample task context are included. Unknown fields are discarded. Generated JSON states that it is fictional, unverified, unsent, and grants no acceptance or portfolio permission. Text is rendered literally, never as HTML. A separate review checkbox gates copying; editing inputs, changing tasks or previewing again clears it and removes old output. Filter changes hide a composer whose task is no longer visible. Clipboard errors remain visible, and late clipboard completion cannot overwrite newer guidance. No message is sent, no agreement is made, and no draft is persisted. The browser clipboard is used only by explicit copy.

All network connections and form navigation are blocked by the page CSP. The review site retains disabled Supabase and an empty Sheets endpoint; repository backend configuration stays unchanged. Existing local contribution storage and handoff formats are untouched.

## Verification

184 JavaScript tests pass, including seven new directory, bounds, minimization, filter, review gate, literal rendering, stale clipboard, and failure checks. All 46 HTML pages pass local asset/link/anchor and unique-ID checks. Controller tests use substituted DOM and clipboard APIs; rendered desktop/mobile behavior is not established by these tests.

## Next production prerequisites

Before real cross-user agent access: authenticated owner identity, tested row-level permissions, explicit discovery opt-in, scoped and revocable agent delegation, recipient acceptance/blocking, rate limits, audit history and human approval for agreements, compensation and portfolio permissions. No live agent messaging, private-data access, autonomous negotiation or ongoing model runtime is introduced here. Database work remains deferred.
