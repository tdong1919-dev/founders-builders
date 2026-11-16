# Authentication email Reply-To

Server-side Send Email hook for Founders & Builders project `ijvokvffhcvakaultzfk` only. All messages use `Founders & Builders <founders@jidokagroup.com>` and explicit `reply_to: ["support@getjidoka.com"]`. Approved branded templates are bundled locally. No application records or service-role key are used.

## Current status

Live hook version 9 is enabled. The owner confirmed that the test authentication email and Reply-To support@getjidoka.com work. Eight automated tests pass. Earlier dated notes below preserve the troubleshooting history; their pending/disabled states are superseded by this confirmation.

## Activation procedure

1. Keep the existing SMTP configuration intact for rollback.
2. In Supabase Authentication → Hooks, prepare a Send Email HTTP hook targeting `https://ijvokvffhcvakaultzfk.supabase.co/functions/v1/fb-auth-email`. Generate a signing secret.
3. The owner stores that signing secret as Edge Function secret `FB_AUTH_HOOK_SECRET` and a sending-only Resend key authorized for jidokagroup.com as `Founders & Builders Auth Hook` (the owner’s existing secret name; `FB_AUTH_RESEND_API_KEY` is also supported as a fallback). Never commit or paste either into chat. Credential entry/submission must be completed by the owner.
4. Enable the hook only after both secrets are saved. This replaces built-in SMTP delivery for authentication emails.
5. Request a sign-in email for the owner's approved account. Verify Delivered in Resend and inspect its request metadata: Reply-To must contain support@getjidoka.com. Confirm sign-in and password/security-code flows with the owner.
6. On any failure, disable the Send Email hook immediately; retained SMTP resumes. Existing SMTP templates remain in place.

## Verification

`npm ci --prefix supabase/functions/fb-auth-email --ignore-scripts`

`node --test tests/auth-email-hook.test.cjs`

Seven tests cover real Standard Webhooks signatures, timestamp/tamper rejection, fixed headers, all auth action types, email-change recipient/hash mapping, redirect and input validation, oversized payload rejection, sanitized failures and idempotency keys.

2026-11-15: deployed inactive hook version 1. Unsigned POST returned 401 Signature required. Hook activation, server secrets and real delivery/header verification remain pending. Existing SMTP still sends with an empty Reply-To, as verified in Resend; do not mark launch verification complete on the basis of unit tests.

## Security

JWT gateway verification is disabled because Supabase signs the webhook using Standard Webhooks HMAC. The handler authenticates signatures and timestamp before sending, rejects browser origins and arbitrary redirects, pins sender/Reply-To/provider/project, bounds payload size and provider wait time, and emits no tokens or provider errors in responses or logs. Provider credentials exist only in Edge secrets. No paid plan, schema migration, collaboration notification activation or Sheets change is involved.

2026-11-15 update: deployment reads the owner-saved `Founders & Builders Auth Hook` secret first, retaining `FB_AUTH_RESEND_API_KEY` as a compatibility fallback. The signing secret remains `FB_AUTH_HOOK_SECRET`. No secret values are read or copied during deployment.

2026-11-15 evening verification: both owner-saved secret names are present. After deployment refresh, server-only boolean diagnostics confirm project match, verifier initialization and expected secret formats without exposing values. Earlier live test failed with 503 before any provider email appeared. Later requests were suppressed by the existing three-per-hour owner login limit (window resets 2026-11-16 02:07:35 UTC). Hook was confirmed DISABLED after testing; SMTP retained. A fresh real delivery and Reply-To verification remain required. Diagnostic logging contains only configuration booleans or provider HTTP status codes, never keys, payloads, recipients or sign-in codes.

2026-11-15 21:25 Eastern: diagnosed signed-payload failure as incoming destination mismatch. Generated authentication links now always use the pinned approved WORKSPACE; incoming site_url/redirect_to never control the link. Added regression coverage for foreign incoming destinations. Eight tests pass. Deployed version 9; live test at 2026-11-16T02:25:38Z returned 200 from both fb-auth-email and fb-collaboration (provider accepted message). Browser transport then failed, so Resend Delivered status and actual Reply-To metadata remain unverified. Hook remains enabled. Do not confuse provider acceptance with confirmed inbox delivery or header inspection.
