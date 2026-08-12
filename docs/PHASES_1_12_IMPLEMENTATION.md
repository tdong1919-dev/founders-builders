# Phases 1-12 implementation note

## Audit summary

The existing project is a dependency-free static HTML/CSS/JS site. Each hub reads from
one Google Apps Script Web App through JSONP and writes new rows with POST requests.
`apps-script/Code.gs` owns the sheet tabs, headers, required fields, and enums.

That architecture is still the deployment constraint, so the implementation keeps the
site static and adds a connected platform layer instead of introducing a framework,
server, or auth provider.

## Incremental architecture

- `platform.js` aggregates all 11 hub tabs, normalizes records, and powers universal
  search, local identity, saves, recommendations, concierge results, chapter filtering,
  activity, reports, admin queues, and the graph view.
- `platform.css` adds shared page layouts for dashboard-style surfaces.
- Apps Script now appends missing headers to existing tabs rather than replacing data.
- Existing public hub forms automatically receive `ownerKey`, `accountEmail`, and
  `chapter` metadata when a member has saved a local identity.
- New append-only backend tabs support accounts, saved items, reports, admin actions,
  chapters, curated activity, graph edges, concierge requests, and seed templates.
- Event aggregation uses the same pattern: organizer source requests are written to a
  private `Event Sources` tab, while approved external events appear in the public
  `Events` tab with attribution fields such as `sourcePlatform`, `sourceName`, and
  `sourceUrl`.

## Phase coverage

1. Member accounts/persistent identity: local device identity plus `Accounts` tab.
2. Unified dashboard: `dashboard.html`.
3. Cross-hub connection: all hub records normalized in `platform.js`.
4. Universal search: `search.html`.
5. What I Need / What I Can Help With: `needs` and `offers` profile fields.
6. Matchmaking engine: rule-based recommendations in dashboard.
7. Community Concierge / Ask F&B: `concierge.html`.
8. Trust/moderation/admin: reports, moderation fields, admin action log.
9. Seed/import: `seed-content/` policy and intake template.
10. City chapters: `chapters.html` for DC, Atlanta, Boise, Madison.
11. Activity/opportunities feed: `activity.html`.
12. Network intelligence graph: `network.html`.

## Guardrails

- Demo rows are labeled as demo/template records.
- No real people, investors, companies, or jobs should be fabricated.
- Funding and investor flows show discovery-only disclaimers and store an acknowledgement.
- Admin changes are append-only until secure role-based auth is introduced.
- Event-source forms never collect API keys, OAuth tokens, passwords, or private guest
  data. Secure credentials belong in Apps Script Properties or a future OAuth/auth store,
  and imported events should keep attribution and RSVP links pointed to the original
  organizer platform.
