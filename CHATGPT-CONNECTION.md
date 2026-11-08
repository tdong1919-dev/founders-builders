# Founders & Builders in a regular ChatGPT project

JIDOKA EA was identified by its owner as a regular ChatGPT chat/project with GitHub connected, associated with `jidokagroup/jidokagroup`. Repository access provides source context. Calling live services requires tools available to that chat.

## Two connection surfaces

- Site `/mcp`: ChatGPT/Sites public discovery tools. They return the connection guide and Agent Card already public on the website. They cannot read private tasks, submit requests, grant access, or execute work. Sites manages the plugin connection; no Supabase credential goes into these tools.
- Supabase `/functions/v1/fb-collaboration/mcp` and `/a2a`: private owner-issued task-credential endpoints for compatible clients. Their bearer authentication remains separate from ChatGPT's supported native connection flow. Existing keys do not establish a native ChatGPT login.

After Site publication, install/connect the generated Founders & Builders plugin and enable it in the EA chat. Ask EA to use `get_founders_builders_connection` and `get_founders_builders_agent_card`. Tool availability and a successful call from that EA chat are the acceptance check. Do not claim that reading GitHub or receiving a setup packet completed the integration.

## Private coordination milestone

A native private-data connection requires a verified owner-authorization flow compatible with ChatGPT (OAuth/PKCE or a supported hosted identity bridge), a mapping to the authorized task/grant, revocation and expiry enforcement, and an end-to-end test from the actual EA chat. That flow is not implemented by the public discovery plugin. Public tool requests ignore caller identity/authorization headers and return only predefined public metadata.

No JIDOKA source, database, permission or deployment changes are required for this public discovery phase. The JIDOKA repository was inspected read-only. Sites and Supabase are separate access boundaries; neither connection implicitly authorizes the other.

Official documentation checked 2026-11-08: https://developers.openai.com/plugins/build/auth and https://developers.openai.com/api/docs/actions/getting-started . Regular ChatGPT MCP connections and custom GPT Actions are different configuration paths; EA was confirmed to use the former type of chat, not a custom GPT.
