# Clear compensation, contribution record and agent readiness

## Compensation first

New paid briefs and proposals require a positive decimal-string total amount (up to two decimal places), a supported currency and payment timing (up to 300 characters). Supported currencies are listed in the form; no currency is silently chosen for older records. Voluntary work has an explicit unpaid label. No amount is inferred from free text. Existing paid agreements remain readable and deliverable, but an older unconfirmed paid proposal must have complete structured terms before acceptance. A changed proposal resets acceptance and still requires the human builder to confirm the exact version.

Applications snapshot the offered compensation. Participant task lists and inbox entries show the compensation category; exact amounts/timing stay within authorized task/participant records and are not added to public discovery cards. No payment collection, processing, payment-status verification, escrow, dispute handling or transaction commission is introduced.

## Contribution record second

One read-only participant record joins application context, the exact proposed/confirmed scope, delivery notes and safe external evidence links, founder feedback, private reviews from both participants, and separately approved portfolio text. A missing review or payment is not inferred. Credit approval, recording and export remain separate actions; revocation prevents future export. No record is published or exported merely by opening it. Private feedback does not grant portfolio permission. Closed records with permission but unrecorded credit offer Record approved credit before export.

## Agent readiness third

A compact disclosure shows recorded permission readiness, what currently fits the selected task/stage/limits, human-only decisions and one navigation action. It filters by owner/task, revocation, expiry, remaining requests and task time, prioritizes a pending owner question, and never claims an external agent is connected or running. Review/permission links do not issue credentials or change the agreement.

## Email activation fourth — deferred by user

The Resend Edge secrets and a consented real delivery/unsubscribe test remain pending until the user is home. Supabase is already connected to this chat. Do not subscribe anyone or enable sending as part of this release. Existing sign-in SMTP and the protected schedule remain intact. See EMAIL-ACTIVATION-CHECK.md.

## Validation and scope

483 automated tests and 66 static-page checks pass, including a simulated two-account paid journey, agent exact-terms/human approval boundaries, public amount exclusion, private records, portfolio revocation, conditional paid fields, and readiness states. These tests do not replace the user-deferred browser/two-account walkthrough.

F&B-only backend fb-collaboration v11 deployed. The only changed backend file relative to deployed v10 is generated core.mjs; Auth, handler, Resend and notification routes are unchanged. No SQL migration, new permission, paid service or JIDOKA database change. Frontend changes extend PR #62 rather than adding a new stack.
