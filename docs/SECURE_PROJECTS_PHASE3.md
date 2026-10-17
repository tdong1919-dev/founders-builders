# Secure Projects — Phase 3 architecture
This is a proposed Supabase/Postgres backend migration, **not deployed**. Existing Google Apps Script public hubs remain unchanged.

## Why a separate service?
The existing Apps Script endpoint runs as the Sheet owner and accepts anonymous requests. It is unsuitable for protecting founder project briefs or verifying the identity of collaborators.

## Access model
- Use Supabase Auth identities (auth.uid), not display names, localStorage IDs, or email submitted by a browser.
- Projects are private by default. Public discovery happens through a column-limited RPC that never returns private briefs or unpublished entries.
- Only authenticated owners and explicitly accepted members can read confidential project details via fb_get_project().
- Collaboration applications require a public project, must originate from the signed-in applicant, and are immutable except through owner review or applicant withdrawal RPCs.
- Acceptance inserts a project membership in the same DB transaction.
- Milestones can only be accessed by owners and accepted members.

## Deployment order
1. Create a dedicated Supabase project, enable suitable authentication and email verification settings.
2. Review/test migration in staging. Do **not** paste the service role key into browser JavaScript.
3. Use a publishable/anon key in frontend and keep service-role credentials server-side.
4. Introduce secure project creation/editing RPCs, rate limiting and anti-spam controls before enabling public sign-up.
5. Verify RLS with separate owner, applicant, member, anonymous and unrelated-user sessions.
6. Run negative tests: private projects cannot be searched; self-application is blocked; non-owner review is blocked; repeated acceptance is blocked; declined applications do not grant membership; unrelated users cannot view milestones.

## Design limitations
The SQL migration is a groundwork review artifact. Owner-facing write operations should go through explicit RPCs; the current column-level INSERT/UPDATE grants alone are not a finished API. Email notifications, reporting, account deletion workflows, and user-facing auth integration are not implemented. Never describe these as live.
