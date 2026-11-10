# Shared collaboration and agent permissions — built before Supabase activation

## What works now

- `collaboration-core.js`: participant-scoped tasks, interest, clarifying messages, versioned proposals, explicit contributor confirmation, delivery, founder feedback, separate portfolio permission, private completion, and closure without completion.
- `server/shared-service.mjs`: authenticated command API, transactionally persisted state and append-only activity, idempotent mutation requests, conflict detection, hashed agent credentials, denial audit, and owner-scoped reports. Private state is never sent to Sheets.
- `shared-collaboration-client.js`: same-origin authenticated transport, memory-only credentials, request cancellation and stale-session response protection. No localStorage token or data fallback.
- `shared-workspace.html`: one next action per participant, with advanced controls collapsed. Public preview is fictional and page-memory-only. The opt-in local transport talks to the persistent test service.

These are application-layer foundations, not a claim that live accounts or cross-device cloud saving are activated. The existing browser-local contribution notebooks remain separate; their user-authored packets are not promoted to verified identities or accepted agreements.

## Local persistent verification

Requires Node 24 with built-in `node:sqlite` (experimental in the installed runtime). No dependencies or paid services are installed.

```sh
node server/run-local.mjs
# http://127.0.0.1:8773/shared-workspace.html?transport=local
node --test tests/*.test.cjs
```

The runner binds only to loopback, creates fictional accounts, and persists to a private `shared.sqlite` in the OS temporary directory. `FB_LOCAL_DATA` can select a private local directory; this directory must exist on durable storage for durable retention. Database files are ignored by Git. The development identity endpoint is never a production authentication mechanism and is not included in the Sites Worker.

The same service is exercised by two independent HTTP clients, including a database close/reopen between proposal and acceptance. This proves server-side sharing and restart persistence locally, not connectivity between actual remote devices.

## Authentication and ownership

`createSharedService` requires a trusted `verifySession(token)` implementation. It derives the actor from the returned verified account, never from JSON `userId`, `ownerId`, display names, local notebook identities or a browser role switch. The fixture verifier exists only in the local runner and tests.

`supabaseSessionVerifier` is implemented but not activated: it calls the configured project's `/auth/v1/user` over HTTPS, requires a confirmed email, and fails closed on rejected tokens, redirects or network failures. It uses only a publishable key. It follows Supabase's [server-confirmed user lookup](https://supabase.com/docs/reference/javascript/auth-getuser); tokens are not trusted merely because their JWT payload can be decoded. Hosted account/session behavior still needs testing against the selected project.

`server/configured-service.mjs` composes this verifier with the persistent service only when supplied an explicit HTTPS origin and a persistent database path. Importing it starts no server, creates no Supabase project, and performs no account/network setup. No production listener or reverse proxy is configured.

## API contract

POST `/api/collaboration`, JSON `{operation, params}`, `Authorization: Bearer …`, and a unique `Idempotency-Key`. Browser requests are same-origin only. Mutations may retry the **same body with the same key** after an uncertain response; a different body using that key is a conflict. Reads re-check current permission and are never served from the mutation replay cache.

Human operations: `createTask`, `list`, `readTask`, `interest`, `message`, `propose`, `accept`, `deliver`, `feedback`, `recordCredit`, `closePrivate`, `close`, `allowPortfolio`, `revokePortfolio`, `grant`, `revoke`, `activity`, `agentAudit`, `report`, `exportCredit`.

Agent grants allow an explicit subset of `read`, `interest`, `message`, `propose`, `deliver`. Each grant has one owner, one task, expiry (1–1,440 minutes), request budget (1–20), and task-time limit (15–180 minutes). Every successful authorized agent operation, including reads, consumes budget in the same transaction. All delegated actions are also checked against the owner's participant role. Agents cannot confirm agreements, make portfolio decisions, issue grants, revoke grants or close commitments for people.

Grant creation returns its opaque credential once. Only its SHA-256 hash is stored. Replaying grant creation returns metadata without another secret. Lost credentials should be revoked and replaced, not recovered. Do not place credentials in URLs, logs, localStorage or frontend source. The fictional UI intentionally does not display or retain issued agent secrets.

Revocation is checked from persistent state before every agent command **and replay**. Actions already committed before revocation remain in history; revoked credentials cannot undo or continue them. Token expiry and request limits are enforced by server time. This private command API is separate from the earlier stateless fictional A2A route and does not make that sandbox production delegation.

## Collaboration invariants

1. A founder owns a task because the server-created record uses their authenticated ID.
2. A contributor can express interest only in someone else's public task. Interest grants no ownership.
3. Founder proposals carry a terms version. The contributor must confirm that exact version with their own human session. Revising terms clears prior acceptance; stale writes return 409.
4. Delivery requires the currently accepted terms. Duplicate network retries record one delivery.
5. Only the founder can review delivered work. Feedback does not imply portfolio permission.
6. Contributors may complete privately. Permitted exports contain only the founder-approved credit text and a participant-recorded qualifier, not private title, feedback, delivery notes or evidence links.
7. Revoking portfolio permission stops subsequent exports, including reuse of an earlier export request key. It cannot recall previously downloaded/copied material.
8. Either person may close without claiming completion. Neither agents nor stage labels manufacture completed work or verified accomplishments.

The activity ledger preserves proposal versions and participant messages; it is participant-scoped, not a public ecosystem transcript. Denial audit includes operation/reason and IDs, never bearer tokens or raw request bodies. Reports aggregate only the requesting account's authorized records, with no rankings or invented success comparisons. The ledger is append-only through this API, not tamper-proof against a database administrator.

## Supabase-last activation boundary

**No Supabase changes were made.** Existing `secure-config.js` remains disabled, and the Sheets/App Script settings and code remain unchanged.

The tested persistence implementation is SQLite, not Supabase/Postgres. Final activation still requires choosing the real storage deployment: provision a persistent private service volume, or port the transaction/storage layer to Supabase/Postgres and test its RLS/RPC boundaries. The static Sites review Worker does not host the Node/SQLite service. Do not expose the loopback test identity endpoint publicly or mistake configuring a key for completing this storage integration.

For launch, connect real Supabase sessions, complete the storage integration/migrations, provide the same-origin private API endpoint, verify backups/restore and retention/deletion behavior, then run owner/contributor/unrelated/anonymous/expired/revoked account tests on the actual deployment and two actual devices. Public browser auth wiring remains intentionally disabled until these checks pass. No paid hosting, model runtime, database subscription, email service or account upgrade has been authorized or added.
