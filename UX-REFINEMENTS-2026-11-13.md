# Guided workspace and sign-in refinements

## Implemented

- Inline, accessible email-request progress, confirmation and next steps directly under the sign-in button. Confirmation remains deliberately generic to avoid revealing whether an address is approved. It does not promise provider delivery.
- Optional password sign-in for existing accounts, with no password signup route. A verified, signed-in owner can request Supabase's reauthentication code and submit it with a new password in Settings. Passwords are never placed in URLs, draft persistence, collaboration records or logs. Email sign-in remains the recovery route. The existing Supabase Auth password endpoint was checked with fictional invalid credentials and correctly denied them; email Auth was enabled. Real password creation/code delivery still needs the owner's hands-on check.
- My next step, Profile & opportunities, My contributions and Settings separate the main workspace. Publication has Profile, Post an opportunity, Project cards, Exchange terms and Portfolio sections.
- Short-step forms present at most two questions at once, retain entered values during navigation, skip conditional payment fields and reveal invalid required fields. No step auto-submits, publishes or accepts terms. Profile and opportunity publication still requires exact review and consent.
- “Give constructive feedback” replaces the prototype prompt, with matching feedback-oriented draft content.
- “Not included” explains work outside the agreed deliverable. Ownership example text distinguishes permitted work use, pre-existing tools and separate permission for public credit; confidential/proprietary material is not automatically publishable. These are editable proposed terms, not platform-defined ownership transfers.
- Feedback timing explicitly starts after delivery, with a seven-day editable proposal example. Non-monetary exchange examples distinguish promised mentoring, consented introductions and agreed reuse rights from possible future work. Feedback and portfolio credit remain separate expectations.
- Minutes, hours and eight-hour working days convert to an integer minute estimate. Human tasks/profile capacity/public filters accept 15–14,400 minutes (30 working days). Deadline and effort are not conflated. Existing agent-grant limits remain capped at 180 minutes; no existing permission is widened.
- Project card drafts reuse saved project name, overview and milestone; public editing and separate approval remain mandatory. An optional opportunity summary can derive from the owner-entered deliverable.
- Written agreements are generated from exact saved proposal terms and marked draft or confirmed by recorded version. The participant-only agreement can be copied explicitly. It is a written record, not a separate PDF/signature system or proof of payment. Delivery/feedback and portfolio credit have separate record tabs. Editing exchange terms affects future proposals, not an accepted agreement.

## Email template and remaining activation

`supabase/email-templates/magic-link.html` prepares the warm welcome, Crystal Dong's signature, support contact and personally authorized LinkedIn link/icon. Subject and activation instructions are alongside it. It keeps Supabase's standard confirmation URL and code variables.

The template is **not yet applied**: connected tools do not expose Auth email settings and browser access is disabled. Actual Reply-To `support@getjidoka.com` must be configured/verified at the sending provider; a body mailto link does not set it. No credentials were entered, no authentication email was sent and no real password changed by the agent.

## Validation and rollout

Automated tests cover step navigation/invalid-field recovery, conditional skipping, keyboard tabs, sign-in message placement, password transport/session checks, exact participant-only written agreements, effort bounds, publication consent and existing collaboration privacy. Static link/asset/ID checks cover 67 HTML pages. The fictional walkthrough uses the identical controller and isolated adapter; it never contacts real Auth or databases.

Browser-rendered desktop/mobile acceptance and a real password/security-code test remain unverified while local browser access is disabled. Only the human effort bounds change in the existing collaboration Edge Function; no schema, signup approval, payment, email-dispatch, Sheets or existing agent permission changes are intended. Deployment identifiers and results are recorded in the pull request.
