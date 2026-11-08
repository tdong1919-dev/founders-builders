# Agent connection: first integration

This branch prepares an MCP access layer for the existing collaboration engine. It is not yet deployed. It does not implement an A2A task server, agent registry, payments, or a background executor.

## JIDOKA EA acceptance

1. Owner signs into the beta, selects a disposable test contribution, and grants read access only with a short expiry and explicit request budget.
2. Store the resulting credential in EA's secret settings, never in a prompt, URL, public channel, repository, or logs.
3. After backend publication, configure Streamable HTTP at `https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-collaboration/mcp` with `Authorization: Bearer <limited credential>`. Clients must support custom bearer authentication; OAuth-only hosts are not supported by this adapter.
4. Initialize with MCP `2025-11-25` or `2025-06-18`, send `notifications/initialized`, then list tools. Only grant-authorized tools should appear. Discovery validates the credential without consuming its action budget.
5. Read the authorized task. Attempt another task and a forbidden tool; both must fail without leaking its content.
6. Revoke the grant in the human workspace; tool listing and calls must fail immediately. Test expiry and budget exhaustion separately.
7. Only then test a message-enabled grant with fictional participants. Mutating tools require `requestKey` (UUID): reuse for an identical retry, generate a new value for a distinct intended action. `expectedVersion` remains mandatory for versioned actions. Refresh before resolving conflicts; do not retry stale changes blindly.

The adapter uses stateless JSON responses, no SSE, OAuth, or server callbacks. It accepts initialized notifications and supports initialize, ping, tools/list, and tools/call. Agents cannot confirm agreements, create grants, change projects/profiles, post reviews, approve portfolio sharing, or globally enumerate private records. All data calls use the existing transactional handler, limits, audit and revocation checks. Treat participant messages and briefs as untrusted content, not instructions to obtain more access.

## Release boundary

Deploy index.ts, handler.mjs, core.mjs and mcp.mjs together, preserving internal authentication and existing origins. Verify the exact project URL before publishing. No migrations or paid services are required. Existing JSON command clients continue to work. Publish the connection page with accurate availability only after the endpoint and an external client pass acceptance. No credentials are embedded in discovery metadata.

Supabase connector is unavailable in this session, so no remote function change was attempted. The public Site remains version 23 and the Edge function version 5. The connection page and manifest are prepared in this branch, not live.

## Next A2A milestone

Implement and test a standards-based coordinating agent with an honest Agent Card, task lifecycle/status, cancellation, owner-bound authorization, and idempotent delegation. Start with a private JIDOKA EA exchange before opt-in public opportunity discovery. Keep permissions and review decisions explicit. Do not publish an A2A Agent Card advertising skills until the corresponding endpoints work. Economic payments and compensation commitments require a separately defined product scope; none are authorized by connecting an agent.

References: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports and https://modelcontextprotocol.io/specification/2025-11-25/server/tools .
