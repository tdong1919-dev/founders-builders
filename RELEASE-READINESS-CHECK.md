# Public-beta release check

## Review

Reviewed PR #62's 34 changed files and dependency on main. No review threads or submitted reviews were present. Fresh validation passed 493 automated tests, all 66 static pages, real/preview controller equality and diff checks. Fixed two review findings before merge: review acknowledgment now clears on input and change events; missing legacy proposal versions cannot imply agreed compensation. GitHub records the final merge outcome.

## Application backup and recovery

Captured a consistent application snapshot from F&B project ijvokvffhcvakaultzfk, containing all 12 application tables, two minimal Auth identity mappings, migration history and reviewed application/schema source. Created an AES-256-GCM encrypted archive outside both repositories, with an independently stored owner-only random key. No secret was printed or committed. Archive/key permissions and tamper rejection passed.

Restored into an isolated disposable local PostgreSQL 16.15 database, compared every table with row-order normalization that preserves meaningful nested array order, verified identity mappings, denied anonymous/raw client reads and allowed the trusted service read. Local restore credentials and email were disabled before exercising workflows. No production restore or data mutation occurred; the cluster was stopped and removed after testing.

Limit: this is not a full managed Supabase-project restore. Auth sessions/password hashes, Vault values, Storage objects and runtime/provider configuration are excluded. The owner must preserve an off-device archive and a separate recovery key. The report and manifest remain in the owner-only local backup directory, not the GitHub repository or public site.

## Reporting, blocking and deletion drill

With synthetic local sessions and the actual collaboration handler/persistence functions: private report persisted, another account could not see its data, operator triage was recorded, blocked outreach failed, deactivated human access failed and revoked agent access failed. Removal of a disposable user's profile, private project, public capability card, participation, related audit/cache references and local Auth stub was verified by absence of its marker and identity references. Both founder and builder roles were represented. The real hosted accounts and private collaboration records were untouched.

Limit: real support delivery/acknowledgment, account ownership verification, shared-record retention decisions and managed Auth deletion still need an owner-assisted controlled account check. The prepared support email remains unsent pending explicit authorization. Support contact/SLA and deletion policies are operating commitments, not automatically proven by unit or offline tests.

## Blocked human checks

- Work settings return “Local browser use is disabled.” No desktop/mobile or genuine two-account browser walkthrough is claimed.
- Browser policy requires the owner to enter and submit the replacement database password. Rotation is not complete. Do not paste the old or replacement password into chat.
- The connected Gmail mailbox is not the support mailbox. A labeled support-test draft is prepared; its delivery/reply must be verified after explicit send authorization.
- Keep the beta approval-based. Do not describe this check as approval for unrestricted public signup.
