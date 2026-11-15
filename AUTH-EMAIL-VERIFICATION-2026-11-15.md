# Authentication email and mobile verification — November 15

Only Founders & Builders project `ijvokvffhcvakaultzfk` was edited. No JIDOKA project, credentials, signup policies, private records or email-dispatch schedules were changed.

## Completed in the Codex browser

- Saved the branded Magic Link subject/body and checked the rendered dashboard preview. The default template was fully replaced; confirmation URL and one-time token variables remain intact.
- Saved matching Reauthentication branding for the password security-code email. The code remains in the body, not the subject.
- Submitted one explicitly requested founder sign-in test. The live form displayed both requesting and actionable request-received states, without promising delivery or exposing approval status.
- Inspected the SMTP screen: custom SMTP/Resend is enabled; a separate Reply-To field is not available. No sender or credentials were altered.
- Tested the fictional publishing UI at 390 × 844: only the current two questions are exposed, Continue advances correctly, and measured document width did not exceed the viewport.
- Found shared mobile button sizing stretching publishing tabs into five full-width rows. Added a scoped width override; also removed the duplicated long email confirmation above the sign-in form. The accessible inline message remains.

## Still requires verification

The connected mailbox does not contain the owner's new sign-in email. That is not proof of nondelivery: it is a different connected inbox. The owner must open the received email and enter its code directly in the Codex workspace tab. Do not copy its link/code into reports or chat.

Actual received-message From/Reply-To/authentication headers are not verified. The body support link does not configure Reply-To. If the current SMTP sender cannot supply the required header, use a supported SMTP-header configuration or a properly secured custom Send Email hook; do not simulate it with HTML or change to an unverified sender.

A real password must be created and submitted by the owner, then tested by the owner in the browser; the agent does not choose, read or submit it. No password was changed during the independent checks.

## Validation

37 focused controller/navigation/guided-form/fictional-preview tests pass. All 67 HTML pages pass asset/link/anchor/ID checks. The mobile CSS change is presentation-only and does not alter permissions or stored records. Deployment results and subsequent browser checks are recorded in the pull request.
