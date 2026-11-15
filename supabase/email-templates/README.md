# Authentication email branding

Target only Founders & Builders project `ijvokvffhcvakaultzfk`.

Prepared Magic Link subject: **Your Founders & Builders sign-in**. Paste `magic-link.html` into Authentication → Email Templates → Magic Link after reviewing its preview. Keep `{{ .ConfirmationURL }}` and `{{ .Token }}` intact. Do not add tracking redirects or include private project content. The LinkedIn URL is Crystal's personal profile from the JIDOKA repository; no other social identity is guessed.

Requested Reply-To: `support@getjidoka.com`. A mailto link in HTML does **not** set an email's Reply-To header. Verify the actual delivered header with the configured SMTP provider. If Supabase's SMTP settings do not support a separate Reply-To, configure a supported provider/hook path and test it before claiming this is complete. Do not change the verified sender to an unverified domain, expose sending credentials or bypass auth email controls.

Original November 13 status: template prepared but not applied while browser access was disabled. See the November 15 verification below for the applied templates and remaining delivery/header checks.

## November 15 dashboard verification

The Magic Link template and subject were applied in project `ijvokvffhcvakaultzfk` and checked in the dashboard preview. The matching `reauthentication.html` template was also applied with subject **Your Founders & Builders security code**. Its subject deliberately omits the code so notification previews do not display it. Both saves completed with the Save changes button returning to disabled.

The current SMTP screen uses Resend and exposes sender email/name, host, port, username and password, but no separate Reply-To control. No SMTP credential or sender identity was changed. An actual `Reply-To: support@getjidoka.com` header has **not** been verified or configured; support mailto links in both templates do not count as header verification. One owner-requested live sign-in test was submitted; real inbox/header and password setup checks await the owner.
