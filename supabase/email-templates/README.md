# Authentication email branding

Target only Founders & Builders project `ijvokvffhcvakaultzfk`.

Prepared Magic Link subject: **Your Founders & Builders sign-in**. Paste `magic-link.html` into Authentication → Email Templates → Magic Link after reviewing its preview. Keep `{{ .ConfirmationURL }}` and `{{ .Token }}` intact. Do not add tracking redirects or include private project content. The LinkedIn URL is Crystal's personal profile from the JIDOKA repository; no other social identity is guessed.

Requested Reply-To: `support@getjidoka.com`. A mailto link in HTML does **not** set an email's Reply-To header. Verify the actual delivered header with the configured SMTP provider. If Supabase's SMTP settings do not support a separate Reply-To, configure a supported provider/hook path and test it before claiming this is complete. Do not change the verified sender to an unverified domain, expose sending credentials or bypass auth email controls.

Status: template prepared, not applied. The connected Supabase tools expose no Auth email configuration operation, and local browser access was disabled at implementation time. Actual inbox rendering, delivered Reply-To and security-code delivery still need verification. No new sign-in email was sent during this work.
