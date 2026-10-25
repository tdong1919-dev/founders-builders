# Real cloud collaboration beta

The cloud workspace at `cloud-workspace.html` uses verified Supabase email identities and persistent collaboration records. The existing Sheets and Apps Script paths are unchanged. The fictional shared-workspace walkthrough remains separate.

## Activated infrastructure

Project reference: `ijvokvffhcvakaultzfk` (Free). Five migrations through `20261025_shared_cloud.sql` were applied. Projects, collaboration requests, members and milestones use RLS. Shared collaboration state and approved beta accounts use default-deny RLS with no browser table grants. The Edge Function `fb-collaboration` verifies each user with Supabase Auth and checks beta approval before executing domain commands. Scoped agent credentials are hashed, bounded, checked on every request and revocable.

The frontend contains only a publishable key. Server credentials stay in the Edge runtime. Sessions stay in tab memory, callback fragments are removed immediately, and sign-out clears rendered private records. Reloading can require another sign-in. Default email uses a magic link; no custom SMTP or paid services were configured.

The approved authentication Site URL is `https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html`. Deployment v13 introduced the page; v14 corrects the email success-message response handling.

## Validation

- 244 Node regression tests, including cloud authorization, scoped agent revocation, response races, callback cleanup and email response handling.
- 51 HTML pages pass local asset/link/anchor/ID checks.
- 60 SQL assertions passed against hosted PostgreSQL inside rollback-only test transactions.
- 10 live anonymous/forged-credential boundary requests passed.
- The first approved real sign-in email was sent. Opening the link remains the user's action.

Security advisors still identify intentional scoped SECURITY DEFINER functions and default-deny tables without policies; these are reviewed design choices, not a warning-free advisory report.

## Remaining release gates

Complete a real authenticated save/reload test after the owner opens the email, then a second separately approved real account and second-device test of interest → versioned agreement → delivery → feedback → portfolio permission/revocation. Test fixtures and injected identities do not establish real multi-user JWT verification. Broad signup remains closed.

The first beta uses an atomic revisioned aggregate with explicit size limits. It is not a claim of production-scale storage. Binary uploads and Supabase Storage buckets are not enabled. Cloud storage here means persistent private collaboration records in PostgreSQL. No GitHub main deployment or merge is part of this activation.
