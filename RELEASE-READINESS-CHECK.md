# Approval-based public beta launch checklist

Final review: November 11, 2026 (America/New_York).

Launch disposition: ready for a limited, approval-based public beta with collaboration emails and legacy Sheets submissions off. This is not authorization for unrestricted signup, email activation, paid upgrades, or an announcement sent on the owner's behalf.

## Release and user journey — complete

- [x] PR #62 reviewed, validated and merged at `7572bc5fe34a2784f7cd3300c1f5a925a71c4858`.
- [x] Sites version 59 is active at https://founders-builders-ux-review.hello978822.chatgpt.site; public website access is separate from approved collaboration-account access.
- [x] `fb-collaboration` version 11 is active only in Supabase project `ijvokvffhcvakaultzfk`. No JIDOKA product database was used.
- [x] 493 automated tests and all 66 static page checks passed. Real/fictional workspace controllers and diff checks passed.
- [x] Fresh two-account synthetic journey passed: discovery → application → versioned proposal → confirmation → delivery → feedback → separately approved portfolio credit → mutual reviews.
- [x] Founder and builder identities remained separate in Chrome tabs; a shared contribution was visible to both and a private founder task was absent from the builder task list.
- [x] Builder application, agreement, delivery and credit were exercised at a 390px viewport with a 390px document width. Reload preserved the sign-in and completed record. This was browser emulation, not physical-device certification.
- [x] Portfolio export contained only the approved synthetic credit plus the participant-recorded disclaimer; fictional export revocation was also checked. No proof of payment is implied.

Two review defects were fixed before PR #62 merged: review acknowledgment clears on both input and change, and a missing legacy proposal version cannot imply accepted compensation. Browser messaging-channel errors appeared during testing but did not prevent the tested journey. Labeled synthetic contribution/review records remain for inspection.

## Security and privacy — complete within the stated beta scope

- [x] All 12 application tables have RLS enabled. No public-schema raw table grants or executable public SECURITY DEFINER functions are available to anon/authenticated roles. The eight RLS-without-policy informational findings are intentional service-only tables.
- [x] All 10 real HTTPS checks passed for anonymous/forged-token denial, private tables/RPCs, origin restrictions and available email authentication. They passed again after SSL enforcement and the owner-reported password reset.
- [x] Direct Postgres SSL enforcement enabled after explicit owner approval of the database restart. Project returned healthy; website APIs already use HTTPS.
- [x] Owner reported successful reset and separate saving of the previously shared database password. Neither replacement nor old password was read or used by the agent.
- [x] All four historical agent grants have revocation timestamps; no live grant remains.
- [x] A synthetic live private report persisted and its operator review was recorded. The founder participant UI did not reveal it; automated and offline tests cover report privacy, blocking and suspension.
- [x] A disposable, owner-verified account completed the hosted deletion drill after exact confirmation: access disabled, sessions revoked, private profile/event/cache references removed, and Auth identity deleted. Database checks found no remaining Auth user, approval, session or identity/test marker in application state. Browser refresh cleared the deleted account's private workspace. Both original accounts remained intact.

One provider advisory remains accepted for this $0 beta: leaked-password protection is disabled and Supabase documents it as Pro-only. The application uses approved verified-email sign-in. No paid upgrade was made. https://supabase.com/docs/guides/auth/password-security

This review is not a penetration test or a guarantee of zero vulnerabilities. Shared-record deletion still requires case-by-case retention decisions; the disposable account had no shared contributions or owned projects/tasks.

## Recovery — complete

- [x] Revision 35 encrypted application snapshot covers all 12 application tables, two minimal Auth identity mappings, migration history and reviewed application/schema source.
- [x] AES-256-GCM integrity/tamper rejection, owner-only local permissions and isolated PostgreSQL restore/security checks passed. All table contents round-tripped; restored credentials and email were disabled, and the temporary cluster was removed.
- [x] Owner uploaded all three recovery files to their personal Drive. Browser verified tdong1919@gmail.com, Restricted access and only the owner on the dated folder.
- [x] The Drive archive was downloaded and matched the verified local archive exactly: SHA-256 `69919a92d25d0a71352d50f1b8f6eaceebaa2354aaccad0c542fe84970377c29`, 317,517 bytes.
- [x] No key file was uploaded with the archive. Owner reported saving the matching key separately.

Recovery archive location is held by the owner in restricted personal storage; its private link is intentionally omitted from the repository.

This is application-data recovery, not a full managed Supabase restore. Auth password hashes/sessions, Vault contents, Storage objects and provider/runtime configuration are excluded. The superseded local revision-33 snapshot containing the disposable identity map and its matching key were removed after final verification. Backup files, keys and private raw records are not committed or hosted publicly.

## Support and operating policy — verified and assigned

- [x] Public operator: JIDOKA Group. Accountable reviewer: Crystal. Support/privacy contact: support@getjidoka.com.
- [x] Support test `FB-SUPPORT-20261110` was sent to the published address. Its thread contains a reply from support@getjidoka.com saying “Received,” dated November 11 at 7:29 AM Eastern. Gmail headers show SPF, DKIM and DMARC pass.
- [x] Receipt/reply verified independently. The reply was labeled SPAM in the connected sender mailbox, which explains why ordinary inbox searches missed it. Mailbox labels were not changed. This proves the tested round trip, not universal inbox placement or continuous staffing.
- [x] Approved policy retained: acknowledge support/privacy/deletion requests within 7 days; aim to complete deletion within 30 days; pending access requests retained for up to 90 days; Crystal reviews reports and appeals.
- [x] Daily retention job's scheduled run completed successfully. There are no pending reports in the final check.

Crystal's ongoing duty: review requests and reports, including Spam, and monitor provider health, auth failures/429s, Edge errors, database/free-tier usage and delivery problems daily during beta. The checklist does not create an automated monitor or prove future response times. Compensation is arranged directly between participants; the platform processes no payment and takes no transaction cut.

## Deliberate launch settings

- [x] Collaboration access remains approval-based; two approved accounts remain after disposable-account cleanup. Public access requests do not create approvals or marketing subscriptions.
- [x] Collaboration-email subscriptions and outbox are empty. Live UI previously verified unavailable/off. The `fb-beta-notification-dispatch` cron job was explicitly disabled for launch and read back as inactive. Daily `fb-beta-retention-and-metrics` remains active. Sign-in SMTP is separate.
- [x] Legacy submission configuration remains `LEGACY_SUBMISSIONS_ENABLED=false` with a blank `PROFILES_API` in the version-59 source. No frontend or hosting version changed. Direct asset re-fetch was blocked by client/hosting access controls in the final review; no unsupported bypass was attempted. Earlier static checks and deployed-version provenance remain the evidence for this gate.
- [x] Supabase organization is Free; no paid branch, compute upgrade or paid monitoring was enabled. Earlier database measurement was approximately 13.2 MB, not a full provider quota/billing report.

Do not activate collaboration emails until a consented delivery/unsubscribe test passes. Do not enable Sheets routes until isolated Google verification and a reviewed live deployment pass. Do not open unrestricted signup without a separate review. A custom domain is optional and would require exact Auth redirects/origin/SEO updates and retesting.

## Deployment and rollback

No frontend or Edge redeployment was needed for the final checklist. The only new production setting in this final pass was disabling scheduled collaboration-email dispatch. Documentation is maintained separately from public assets.

For rollback, select an exact known-good Sites saved version. Version 58/source `11610e9f799a444d1968e37871821fc8a63f6477` is the documented earlier baseline; version 59 contains the reviewed fixes. Frontend rollback does not roll back SQL or private state. Never re-enable legacy endpoints as a rollback shortcut. Restore application data only after an isolated restore and explicit reviewed operator decision.
