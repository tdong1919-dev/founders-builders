# Real cloud collaboration beta

The cloud workspace at `cloud-workspace.html` uses verified Supabase email identities and persistent collaboration records. The existing Sheets and Apps Script paths are unchanged. The fictional shared-workspace walkthrough remains separate.

## Activated infrastructure

Project reference: `ijvokvffhcvakaultzfk` (Free). Five migrations through `20261025114600_shared_cloud.sql` were applied. Projects, collaboration requests, members and milestones use RLS. Shared collaboration state and approved beta accounts use default-deny RLS with no browser table grants. The Edge Function `fb-collaboration` verifies each user with Supabase Auth and checks beta approval before executing domain commands. Scoped agent credentials are hashed, bounded, checked on every request and revocable.

The frontend contains only a publishable key. Server credentials stay in the Edge runtime. Access and rotating refresh tokens now persist in this tab’s sessionStorage for a maximum of 12 hours; no user identity, task records, or agent credentials are stored there. Saved sessions are verified against Supabase before rendering. Concurrent renewals share one request, and renewed identities are reverified. Callback fragments are removed immediately; sign-out removes saved tokens and rendered private records. Browser-history returns recheck the session. Blocked browser storage falls back to memory-only sign-in. Default email uses a magic link; no custom SMTP or paid services were configured.

The approved authentication Site URL is `https://founders-builders-ux-review.hello978822.chatgpt.site/cloud-workspace.html`. Deployment v13 introduced the page; v14 corrects the email success-message response handling.

## Validation

- 259 Node regression tests, including cloud authorization, scoped agent revocation, response races, callback cleanup, tab-session restoration, renewal, identity checks, browser-history return, and sign-out.
- 51 HTML pages pass local asset/link/anchor/ID checks.
- 60 SQL assertions passed against hosted PostgreSQL inside rollback-only test transactions.
- 10 live anonymous/forged-credential boundary requests passed.
- The owner completed real email sign-in and saved “Cloud save test” from their phone. A scoped agent credential read that persisted task (HTTP 200), broader listing was denied (403), and revocation blocked the same task read (403) before expiry. Credentials were not saved in source.

Security advisors still identify intentional scoped SECURITY DEFINER functions and default-deny tables without policies; these are reviewed design choices, not a warning-free advisory report.

## Remaining release gates

The owner reported completing the two-real-account journey through contribution completion and confirmed that an unpublished founder task stayed hidden from the builder account. These are user-observed UI results; the connector was unavailable for independent final database inspection. Broad signup remains closed. The new session behavior still needs a real phone sign-in → browser refresh → navigate away/back → sign-out check. Existing memory-only sessions require one new sign-in after updating because the previous client discarded refresh tokens. No sign-in email was sent for this update.

The first beta uses an atomic revisioned aggregate with explicit size limits. It is not a claim of production-scale storage. Binary uploads and Supabase Storage buckets are not enabled. Cloud storage here means persistent private collaboration records in PostgreSQL. No GitHub main deployment or merge is part of this activation.

Session implementation follows Supabase’s rotating refresh-token model: https://supabase.com/docs/guides/auth/sessions. Browser-readable tokens remain sensitive to same-origin script access; this tab-scoped beta storage is not an HttpOnly cookie session. The Edge Function continues to verify real JWTs and per-account beta approval on each operation.

Email delivery investigation: the provider rejected the 2026-10-25 22:05 UTC sign-in request with HTTP 429 (`over_email_send_rate_limit`) after two successful sends in the prior hour. Edge version 2 maps this to a safe actionable 429 response; the browser displays that message. Generic approved-address messaging no longer promises a send when a local cooldown prevents it. No extra email was sent while diagnosing. Supabase’s built-in mail service has a project-wide two-email/hour limit (https://supabase.com/docs/guides/auth/rate-limits); reliable wider invitations require a separately configured mail service. No SMTP, paid service, or billing settings were changed.

## Resend SMTP activation

Activated custom SMTP on 2026-10-26 UTC (2026-10-25 Eastern), with explicit user authorization. Supabase still handles authentication; the existing JidokaGroup Resend account delivers auth email. Sender: `Founders & Builders <founders@jidokagroup.com>`. Host: `smtp.resend.com`, TLS port 465, username `resend`. A dedicated sending-only key is restricted to `jidokagroup.com` and stored only in Supabase SMTP settings; no key value is recorded here or in frontend code. The unused first key was deleted with explicit approval. Reloading the dashboard verified persistence.

The authorized single sign-in test returned HTTP 200 from the application and Supabase Auth. Resend showed “Your sign-in link” as Delivered at 2026-10-26 01:24 UTC. The recipient must open the one-time link themselves. No template or DNS changes were made. The account was verified on the Free transactional plan (3,000/month, 100/day), with paid overages disabled; no billing changes were made. Supabase displayed a 30-email/hour limit when enabling custom SMTP. Existing app approval and per-address cooldown controls remain active. This supersedes the built-in-provider delivery blocker above; the new phone session refresh/navigation/sign-out check still remains.
