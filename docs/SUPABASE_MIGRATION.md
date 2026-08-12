# Supabase Migration

Founders & Builders now has a Supabase foundation alongside the existing Google
Sheets/App Script backend. The live frontend still defaults to Google Sheets until data
is migrated and spot-checked.

## Connected Project

Public client values are stored in `config.js`:

- Supabase URL: `https://hgnkpyfxghglsxqprphy.supabase.co`
- Publishable key: `SUPABASE_PUBLISHABLE_KEY`
- Active backend toggle: `DATA_BACKEND`

Never put the Supabase service role key in `config.js`, HTML, client JavaScript, Git, or
Netlify public environment variables. Use it only locally or inside trusted server-side
jobs.

## Frontend Adapter

`supabase-adapter.js` is loaded after `config.js` on the hub and platform pages. When
`DATA_BACKEND` is set to `"supabase"`, the adapter:

- reads public hub records from the `fb_` tables through Supabase REST;
- writes public submissions directly to the matching table under RLS;
- translates the current camelCase frontend fields to Supabase snake_case columns;
- preserves original submission payloads in `raw_data`;
- supports admin reads/writes with a Supabase Auth access token;
- keeps Google Sheets untouched while `DATA_BACKEND` remains `"google-sheets"`.

The frontend should stay on `"google-sheets"` until the migration counts and spot checks
look right.

## Tables

The migration creates `fb_`-prefixed tables so it does not collide with other tables
already present in the connected Supabase project.

Public hub tables:

- `fb_profiles`
- `fb_businesses`
- `fb_listings`
- `fb_jobs`
- `fb_mentors`
- `fb_help_requests`
- `fb_raises`
- `fb_investors`
- `fb_events`
- `fb_collaborations`
- `fb_podcasts`
- `fb_resources`

Private/admin/platform tables:

- `fb_admins`
- `fb_event_sources`
- `fb_accounts`
- `fb_saved_items`
- `fb_reports`
- `fb_admin_actions`
- `fb_chapters`
- `fb_activity_items`
- `fb_graph_edges`
- `fb_concierge_requests`
- `fb_seed_templates`
- `fb_event_import_runs`
- `fb_event_import_drafts`

## Security Model

- Public users can read visible public hub records.
- Public users can create normal submissions and event source requests.
- Imported external events, admin actions, reports review, source status updates, import
  run logs, graph edges, seed templates, and connector setup are admin-controlled.
- Admins are rows in `fb_admins`, matched by Supabase Auth user ID or email.
- Funding/investor records remain discovery records only; they are not investment,
  legal, tax, or financial advice.

To use the Supabase admin page after cutover:

1. Create a Supabase Auth user for the admin.
2. Add that user's email or `auth.users.id` to `fb_admins`.
3. Set `DATA_BACKEND` to `"supabase"`.
4. Sign in on `admin.html` with the Supabase admin email/password.

## Migration Files

Local migration files:

- `supabase/migrations/20260812000000_founders_builders_core.sql`
- `supabase/migrations/20260812001000_founders_builders_advisor_fixes.sql`

Both have already been applied to the connected Supabase project. If you create a new
Supabase project later, apply these migrations there too.

## Data Migration

Use the migration bridge from the repo root:

```bash
export SUPABASE_URL="https://hgnkpyfxghglsxqprphy.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="paste-service-role-key-here"
export FB_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbxkUEG4blNbl-wXjj7FG7HTECMRvJv8zuAMCnGKIS_RIxhh9fVtb-Azo103LteFX0xXOA/exec"
export FB_APPS_SCRIPT_ADMIN_TOKEN="paste-apps-script-admin-token-here"

node scripts/migrate-sheets-to-supabase.mjs --dry-run
node scripts/migrate-sheets-to-supabase.mjs
```

If `FB_APPS_SCRIPT_ADMIN_TOKEN` is omitted, the script skips private tabs such as
`eventSource`, `adminAction`, `report`, and `account`.

To migrate only specific entity types:

```bash
FB_MIGRATION_TYPES="eventSource,event,adminAction" node scripts/migrate-sheets-to-supabase.mjs
```

The script upserts by `legacy_sheet_id`, so it is safe to rerun after additional Sheet
changes. Existing Supabase rows with the same Sheet ID are updated.

## Recommended Cutover

1. Run a dry run and review counts.
2. Run the real migration with the service role key and Apps Script admin token.
3. Spot-check public hubs and admin tables in Supabase.
4. Create at least one `fb_admins` row for your Supabase Auth email.
5. Switch `DATA_BACKEND` to `"supabase"` in a test branch or preview deploy.
6. Verify one flow first, preferably events and event sources.
7. Verify the remaining hubs, dashboard, search, reports, and admin actions.
8. Keep Google Sheets as a fallback/export source until the Supabase path is stable.
