# Beta release — 10 November 2026

## Published

- Consolidated PR #59 merged: 9fe0f8b38ecfe6513564d586711bfe773c113134.
- Launch controls PR #60 merged: a87acbee2eee003d25318f2be53e53e8c8bea26a.
- Sites version55: https://founders-builders-ux-review.hello978822.chatgpt.site
- Hosting source: 8b8a7b90c611b53844ec2ed227e8c74e5634f925.
- Deployment appgdep_6af37ca6de3c8191bdd92c85150e0e43 succeeded, MCP retained.
- F&B-only backend fb-collaboration v10 deployed. Two launch migrations applied. Source filenames aligned with the actual Supabase migration history, including the earlier baseline; SQL content was not rewritten or reapplied.

## Verified

470 automated tests, 66 static pages, 66 built HTML routes, exact changed assets and private-source 404 checks pass. Ten real anonymous/forged-token HTTPS checks pass. Approved-account login quota was verified in a rolled-back transaction, without email. Dedicated Vault-protected dispatcher returned 200 with enabled=false and sent=0. The daily maintenance command ran successfully and persisted counts only. No users were subscribed and no collaboration email was sent.

Supabase organization plan is Free. Three expired grants were revoked after matching exact IDs, ownership to the two beta test accounts, and expiry; history was preserved. The initial all-credentials cleanup was rejected by automatic approval review and never ran; the narrower verified cleanup succeeded. Zero legacy client-executable SECURITY DEFINER grants remain. Security advisors now show intentional deny-by-default RLS information and the existing leaked-password-protection warning. No paid services, upgrades or JIDOKA database changes occurred.

## Available beta controls

Approval-only verified email access; explicit email preferences; private participant concerns; blocking new outreach; default-off notification queue and protected scheduling; generic email content; stable retry keys; signed unsubscribe; daily/monthly caps; published operator/privacy/contact/retention/compensation policies. Unverified legacy Sheets submissions are disabled, with the original integration code and isolated Google harness retained.

## Remaining before wider public launch

- User will add sending-only FB_RESEND_API_KEY and verified FB_NOTIFICATION_FROM in Edge secrets when home. Keep FB_NOTIFICATIONS_ENABLED unset until a consented test validates real delivery, unsubscribe, and current account-wide Resend allowance. SMTP sign-in mail remains separate and unchanged.
- Browser use is disabled in Work settings. Desktop/mobile visual and genuine two-account validation were not completed for this release.
- Run the isolated Google harness and review the intended live Apps Script version before re-enabling any legacy submission. No live Google deployment was performed.
- Backup, recovery, deletion, moderation and free-tier monitoring procedures are in OPERATIONS.md. A fresh encrypted production backup and restore drill remain unverified; no claim of disaster-recovery readiness is made.
- Review the provider's leaked-password-protection advisory without upgrading paid services. Rotate the database password previously shared in chat through the owner's normal dashboard workflow; never paste a replacement into chat.
- Buy/connect the final domain and update metadata/Auth origins/redirects in a separate reviewed change.

The frontend is deployed, but access stays approval-based. This is not an unrestricted public-signup launch.
