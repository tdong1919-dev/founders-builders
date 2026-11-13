# Beta readiness — November 13, 2026

This review keeps signup approval-based, collaboration email dispatch off, legacy Sheets submissions off and public stories unpublished. No paid service, schema migration, production member approval, report decision or account deletion was performed.

## Administration and first use

The owner-only SQL planner and [operator routine](BETA-OPERATOR-QUICKSTART.md) cover request review, exact-request approval, revision-guarded report decisions, account suspension and read-only deletion inventory. An isolated, socket-only PostgreSQL drill executed the generated plans against fictional records and verified stale-review denial, revoked agent access, public withdrawal and cancellation of unsent updates. Shared work remains retained during suspension. Deletion still requires ownership verification, retention review and explicit permanent-deletion confirmation; the planner deliberately generates no purge.

Workspace now offers a direct first opportunity action for founders, direct profile creation for builders and addressed data-export/deletion request drafts. Public empty directories offer relevant setup, beta-access and clearly fictional walkthrough actions. No empty state creates data, publishes automatically or invents activity.

## Sharing

Publication previews use readable field names and explain the difference between an approved public card and the full member-only brief. Opportunity, profile and project detail pages offer clean public links without workspace parameters or credentials. Profile/project pages include canonical, Open Graph and Twitter metadata using only the approved public projection. Existing opportunity metadata and owner-controlled publication/withdrawal remain in place. Missing or withdrawn records return generic non-indexable responses. External preview caches and recipient-held copies cannot be recalled; no deletion promise overrides that limitation. Live public profile/project examples were not fabricated for testing.

## Validation

- 537 automated tests pass, including public projection, publication/withdrawal, share metadata, safe link copying, first-use guidance and administration guards.
- All 67 HTML pages pass local asset, link, anchor and unique-ID checks.
- The reusable administration drill passes against isolated PostgreSQL; no production account/report is changed.
- The synthetic recovery self-test round-trips schema and all twelve application tables and checks credential/email suppression and privacy/security fixtures. Its local temporary archive, key and cluster are removed afterward.
- Hands-on desktop/mobile and real two-account acceptance remain deferred. Automated tests do not substitute for these checks.

## Operations evidence and limits

Only Supabase project `ijvokvffhcvakaultzfk` was reviewed. The existing collaboration Edge Function remains version 13. The aggregate state was revision 35, with two approved accounts, no pending access requests/reports and no published people/projects. Database size was approximately 13.2 MB; stored aggregate row size was 19,204 bytes, which is not a serialized-character-cap measurement. Retention scheduling was active and its latest daily execution succeeded. Notification dispatch scheduling remained inactive.

The organization is on Free. The security advisor returned eight intentional service-only RLS-without-policy INFO entries and one leaked-password-protection WARN (Pro-only feature; no upgrade enabled). The current [provider pricing](https://supabase.com/pricing) lists Free limits including 500 MB database, 50,000 monthly active users and 5 GB egress; Free has no automatic database backups and may pause for inactivity. Monthly invocation/egress and shared Resend usage were not independently verified. Review dashboards before expanding approvals.

The sampled preceding-day logs contained nineteen function 200s, three 401s and one 403; Auth had one 200 and one 403, with no 5xx in that sample. Intentional denial probes are not automatically incidents. The new read-only health command checks availability and private-source denial manually; no continuous monitor, paging or recurring task was installed. Raw logs, IPs, request bodies and credentials are excluded from this report.

The historical support-test round trip to `support@getjidoka.com` was found, but its reply landed in the connected inbox's spam folder. This confirms that historical delivery, not current inbox placement or staffed response times. Keep the public support address unchanged; inspect spam and maintain the approved seven-day acknowledgement/thirty-day deletion target.

The November 11 encrypted production archive remains local and was previously owner-uploaded off-device. A fresh restore of that actual archive could not run because its matching recovery key is absent locally after separate storage. The current synthetic restore passed, but a new production export/restore and fresh off-device verification were not completed in this review. Restore the matching key locally from the password manager when ready; never paste it into chat or upload it alongside the archive.

## Deployment provenance

The frontend release is Sites version 68, built from source `8bebf4f084771f650c699e182fda65bd6bbd935b`. Saved version: `appgprj_6add5ba8a1688191b29dd954024ebb46~appgver_a0684ea57b548191a553bf631bc408fc`. Deployment result and post-publish checks are recorded below once verified. The hosting repository contains allowlisted frontend assets and the Worker only; administration scripts, backups, private reports and server credentials are excluded.

This release branch is based on PR #71's navigation branch, which already includes PR #72. At review time GitHub main remained at PR #70. Publishing this frontend does not merge the GitHub stack or make main identical to hosting. Keep the coordinated stack visible in the pull request.

Deployment `appgdep_6af73089aa688191866c4977b4020681` succeeded with MCP retained at https://founders-builders-ux-review.hello978822.chatgpt.site. Post-publish checks at 15:46 UTC passed all nine health routes, matched all five changed frontend assets byte-for-byte, verified the four fixed friendly-path redirects, and confirmed operator documentation/scripts are not served (404). These checks made no authenticated writes.
