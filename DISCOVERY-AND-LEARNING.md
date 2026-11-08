# Opt-in discovery, explainable matches, and learning

## Public discovery contract

Beta task visibility and profile discoverability stay separate from public agent discovery. Existing tasks and profiles publish nothing automatically. A verified human owner must write a public headline/summary or name/alias/goal, choose skills, and approve the exact card. Agents cannot opt an owner in.

Opportunity cards expose only card/task IDs, approved title/summary/skills, per-contribution minutes and paid/unpaid type. Capability cards expose only a card ID, approved alias/skills/public goal and per-contribution time limit. Private project overviews, full task briefs, compensation details, account IDs, contact fields, profile text, conversations and reviews are excluded. A person can deliberately put information into a public field; the card is a publication decision, not an automatic redaction service.

Withdrawals remove cards from future discovery. Paused/private steps are excluded. Profile discovery opt-out disables its public card and later profile opt-in does not republish it. Editing task skills withdraws its public card for a fresh review; agreed terms are unchanged. Card-version checks prevent stale forms from resurrecting a withdrawn publication. Withdrawal remains available at the beta storage limit.

The public JSON command is `discoverPublic` with `kind: opportunities|builders`, optional `skills`, and bounded `limit` (1–20) / `offset` (0–5000). Opportunities accept `maxMinutes`; builders accept `minCapacityMinutes`. Native ChatGPT tools `list_public_opportunities` and `list_public_builder_capabilities` forward only these public filters without caller credentials. They do not apply, invite, contact an agent or issue access.

## Match explanations

A match states current shared skills, missing skills to discuss, saved per-contribution time fit, paid-work preference, and overlapping structured practice skills. Free-text goals are not interpreted as proof of competence. A practice goal does not replace the current shared-skill requirement. Calendar availability, readiness, compensation commitments and exact scope still need confirmation. Existing grant match restrictions remain enforced.

## Learning evidence

Private contribution snapshots include a last-activity timestamp derived from recorded contribution events, computed once per list request. Viewing does not advance it. The owner learning view summarizes recorded closed contributions, received participant reviews, and active handoffs with no recorded update for seven days. Missing timing is reported rather than classified as stalled; future timestamps do not trigger inactivity.

Every suggestion links to its exact private contribution and explains the saved stage/time or received review used. Delivered-work prompts respect founder/builder roles. Closed work without the viewer's review prompts reflection. Suggestions perform no outreach or workflow mutation, infer no causation, and make no ecosystem ranking or independently verified success claim. Account history still shows sanitized blocked attempts separately in the owner's control center.

## Release and acceptance

No SQL migration, new service, subscription, or automatic publication is required. Backend and frontend must ship together. Test a disposable public card from each owner role, search via the public tools, pause/withdraw and confirm disappearance, then verify full briefs and private project/profile text remain inaccessible anonymously. Confirm same-account stale forms fail after withdrawal. Live two-account and visual acceptance remain separate from automated checks. Release status is recorded in PROJECT-JOURNEYS.md.
