# Private beta access requests

The journey's begin dot opens beta-access.html, with invited sign-in and a real request form (email, role, explicit consent). Submission stores a pending request only. It does not create an auth account, approve access, send email, subscribe anyone to marketing, or expose project data. The visible confirmation accurately says no confirmation email is sent. Duplicate requests return the same response and do not overwrite the first recorded role or imply membership.

Backend: separate fb-beta-access Edge Function in Founders & Builders project ijvokvffhcvakaultzfk. Existing fb-collaboration version 8 and authentication settings are unchanged. Requests/limits tables have RLS, no anon/authenticated table grants or policies, and a service-only SECURITY INVOKER RPC. The public function validates origin/payload/consent and size, emits generic failures, never logs body/provider errors, and exposes no read/list/approval operations. Runtime secrets stay server-side.

Abuse controls: transactional serialized 10 requests/network/hour and 100 globally/hour; hard inbox cap 1000. Network identifiers are HMAC-hashed with a server secret and removed after seven days when subsequent requests are processed. Header-based network grouping is best-effort; the global cap is independent of that header. No CAPTCHA or automatic approval. Requests are unverified expressions of interest, not proof of email ownership.

## Owner review

Use Supabase dashboard SQL/Table Editor for this exact project, with owner/admin access. There is deliberately no client-side admin shortcut. Inspect pending requests with:

```sql
select email, role, created_at, status
from public.fb_beta_access_requests
where status='pending'
order by created_at;
```

Verify the request and address through the normal manual invitation process before approving an account. Existing approved-account controls remain separate. Mark a reviewed request invited/declined in the private table; changing this status alone does not grant access or send an invitation. Delete requests when no longer needed. No automated invitation/notification was introduced.

## Verification

SQL tests within a rolled-back transaction prove persistence, deduplication, preserved consent/role, rate limiting, RLS and denied table/RPC privileges. Live HTTPS fixture request stored builder/pending/beta-access-v1 and was removed; no email sent. Public-key direct REST reads and RPC execution denied. Invalid/foreign-origin requests denied. Existing ten live collaboration privacy checks pass. Unit tests exercise false-success prevention, duplicate-submit suppression, backend errors, explicit consent and minimal fields.

Security advisor: new tables' RLS-without-policies INFO is intentional deny-by-default. Existing legacy project SECURITY DEFINER RPC warnings and disabled leaked-password-protection warning remain; no new privileged public SQL RPC was added. Review these before broader public release. References:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Desktop/mobile browser visual and measured performance verification remain pending while browser access is disabled. No claims of measured conversion improvement or actual collaboration success are made.
