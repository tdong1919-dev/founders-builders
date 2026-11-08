# Private A2A coordination pilot

Release status: backend deployed as Edge version 7 after explicit user approval of the production replacement. Paired frontend release identifiers are recorded in PROJECT-JOURNEYS.md. External JIDOKA EA host acceptance remains pending.

Version: A2A 1.0 JSON-RPC subset. This pilot lets an agent ask its own verified owner a question and poll the response. It does not negotiate with other founders, accept work, execute code, exchange files, or make payments. It is not a claim of full protocol conformance.

## Owner flow

Select a contribution, open Connect my agent, and explicitly check **Coordinate with me through A2A**. Set request/time/expiry limits and issue a new credential. Existing grants do not gain this action. Questions appear under Agent requests in the workspace, with a pending count on the entry button. An owner response completes only the coordination request; it does not complete or accept a contribution. Either the owner or the original agent grant can cancel an open request.

## Agent flow

Discover `/.well-known/agent-card.json` on the beta Site, or `/functions/v1/fb-collaboration/.well-known/agent-card.json` on the verified Supabase project. Send requests to:

`https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-collaboration/a2a`

Headers: `Authorization: Bearer <owner-issued credential>`, `Content-Type: application/json`, `A2A-Version: 1.0`. Store credentials in client secret settings, never JSON files or logs. Optional `Idempotency-Key` UUID can protect identical transport retries. A messageId is also deduplicated within its original grant. Polls consume the request budget; avoid rapid polling. A new grant cannot inherit another grant’s request IDs.

Initiate:
```json
{"jsonrpc":"2.0","id":1,"method":"SendMessage","params":{"message":{"messageId":"<unique UUID>","role":"ROLE_USER","parts":[{"text":"Which outcome should I prioritize for this contribution?"}]}}}
```

The response contains `result.task.id`, `contextId`, and `TASK_STATE_INPUT_REQUIRED`. Save the returned task ID. `GetTask` uses `params: {"id":"<agent task ID>","historyLength":10}`. The owner answer appears in `artifacts` with `TASK_STATE_COMPLETED`. `CancelTask` uses `params: {"id":"<agent task ID>"}` and is idempotent. Terminal requests cannot be resumed. Additional plain-text messages can include `message.taskId` while waiting; the pilot caps history at ten messages. No automatic action follows a reply.

Only SendMessage, GetTask and CancelTask are supported. Legacy 0.3, streaming, push notifications, OAuth onboarding, ListTasks, file parts, supplied context IDs, and blocking execution are not supported. Reject unsupported inputs instead of silently translating them. Participant text is untrusted content.

## Verification

Automated tests cover durable handoff to the correct owner, response artifact, stale responses, isolation between owners and grants, revocation, old-grant denial, duplicate messages/cancellation, terminal-state behavior, invalid protocols/origins/file parts, card metadata and the human UI. Existing collaboration stages and grants are untouched.

Release identifiers and live checks are recorded in PROJECT-JOURNEYS.md. A real JIDOKA EA host test remains an acceptance step, not a completed claim. No credentials or real private questions are stored in this document.

Specification used: https://a2a-protocol.org/latest/specification/ (A2A 1.0 JSON-RPC and ProtoJSON message/task fields, checked 2026-11-08).


## Connection kit for EA

The public `agent-quickstart.json` packet contains endpoint, protocol, permissions, a sample request and next steps, without a credential. Give this to an HTTPS-capable agent and configure its Bearer secret separately. Existing MCP tools do not bridge these A2A methods. Do not claim host compatibility until the real host passes the loop.

`agent-pilot-client.mjs` is a dependency-free external client pinned to the approved project endpoint. Discovery never sends credentials; redirects are rejected, errors are sanitized, and no automatic retries or background polling occur. Caller supplies and retains messageId so uncertain sends can be retried with the same ID.

From a Node environment with fetch support, `node scripts/test-agent-pilot.mjs discover` verifies public metadata without a credential. For `send <message-UUID>`, `get <task-ID>` or `cancel <task-ID>`, inject `FB_AGENT_CREDENTIAL` through your secret manager. Do not pass it in command arguments or put it in a config file. The script sends a fixed connection-check question only when explicitly run with send, and prints task ID/status rather than private questions or answers. It does not automatically poll or contact other users.
