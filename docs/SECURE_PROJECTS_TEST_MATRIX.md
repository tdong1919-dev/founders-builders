# Phase 3 authentication and security test matrix

**Status: review checklist only. No Supabase instance or live tests have been run.**

Use staging Supabase with four verified identities: OWNER, APPLICANT, ACCEPTED_MEMBER, OUTSIDER, plus anonymous access. Apply the migration in a disposable staging project first.

| Case | Actor | Expected |
|---|---|---|
| Public discovery | Anonymous | Returns only published titles/teasers and permitted discovery columns |
| Discover private project | Anonymous/outsider | No row returned |
| Read private brief | Outsider | Empty response from fb_get_project |
| Read own project | Owner | Private brief visible |
| Create project | Anonymous | Rejected |
| Create project | Owner | Owner ID is auth.uid, initial visibility private |
| Publish project | Owner | Public result contains teaser, never private brief |
| Edit another owner's project | Outsider | No update; return false |
| Apply to private project | Applicant | Rejected |
| Apply to own project | Owner | Rejected |
| Apply to public project | Applicant | Request stored as pending with applicant_id=auth.uid |
| Approve application | Outsider/applicant | Rejected; no member created |
| Approve application | Owner | Status accepted; membership created |
| Decline application | Owner | Status declined; no membership created |
| Read request list | Outsider | Empty |
| Read request list | Owner | Only their project's requests |
| Read milestone list | Accepted member | Allowed |
| Read milestone list | Outsider | Empty |
| Edit milestone | Outsider | Rejected |
| Withdraw pending request | Applicant | Allowed |
| Withdraw other user's request | Outsider | False |
| Forge user ID via request body | Applicant | Cannot change owner_id or applicant_id |
| Browser direct REST table request | Authenticated | Forbidden; only scoped functions exposed |

## Gates before making PR #6 production ready
- Validate migration syntax on staging Postgres/Supabase and run the entire matrix with real sessions.
- Check SECURITY DEFINER search_path, function EXECUTE privileges, and exposed schema permissions.
- Add rate limits to application posting and message moderation/abuse handling.
- Protect signup, recovery, verified identities, and account deletion.
- Add project deletion and project membership removal rules with audit logging.
- Add proper multiuser front-end and CSRF/session safeguards where applicable.
- Ensure published teaser cannot contain confidential details without explicit user review.
- Verify milestone editing and member removal have appropriately narrow permissions.

Do not copy a Supabase service-role key into public JavaScript or check credentials into GitHub.
