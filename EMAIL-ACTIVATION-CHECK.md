# Owner-assisted email activation check

Target only Supabase project ijvokvffhcvakaultzfk. Supabase is already connected; the remaining setup requires adding secrets through the project dashboard. Do not paste credentials into chat.

1. Add FB_RESEND_API_KEY: a sending-only key scoped to your verified sender domain. Add FB_NOTIFICATION_FROM: the exact verified sender name/address. Do not reuse a broad administration key. Leave FB_NOTIFICATIONS_ENABLED unset initially; sign-in SMTP is separate.
2. When the consenting beta tester is ready, set FB_NOTIFICATIONS_ENABLED=true for the controlled check. The recipient explicitly opts in under Workspace → Email & safety. Nobody is opted in by default.
3. From the other approved account, submit one fictional collaboration update for that recipient. Confirm the outbox and scheduled dispatch, then have the recipient verify receipt. The message must contain no private title, idea, application, message, evidence or feedback content.
4. Verify the workspace link uses the trusted site and still requires sign-in. Read the email's unsubscribe page: GET must not change preference. Submit Unsubscribe: POST must disable updates and cancel unsent jobs. Confirm the preference in the workspace; opening the link alone is not enough.
5. Submit another controlled update and verify that it cannot produce a new email after unsubscribe. Also test disable in the workspace, stale preference versions and the duplicate-request path. Do not treat delivery cooldown as proof that unsubscribe worked: inspect disabled preference and cancelled/absent pending jobs.
6. Confirm sender-domain authentication, account-wide Resend usage and both the per-recipient and application send limits. Other products sharing Resend can consume the same provider allowance. The platform must not auto-upgrade.
7. If any check fails, unset FB_NOTIFICATIONS_ENABLED and keep sending off. Record only provider delivery identifiers/status and times, never raw credentials or private email contents. Successful API submission alone is not proof of inbox delivery.

The user-deferred real-account/browser walkthrough remains separate. Automated notification tests cover signed unsubscribe, consent, retries and caps, but actual provider delivery has not been claimed.
