# Simple living-network rollout

## What changed

All 59 existing HTML routes received consistent access, metadata and information navigation. Seven supporting pages bring the total to 66: founder and builder guides, questions, earlier tools, privacy, participation terms and community guidelines. This is a frontend and hosting change; no database migration, authentication replacement, new service, paid plan, or automatic identity/data merge.

- Primary path: home → example / beta access → cloud project or builder profile → contribution → feedback and permitted credit.
- Every full navigation points directly to the cloud workspace without JavaScript rewriting. The public profile form is optional publication, not account registration.
- Earlier planners, local notes and older authenticated workspace stay available under Earlier tools. Their records are not deleted, imported or silently published.
- Community resources grouped by the visitor's need; optional categories use native details. Public submission forms retain their backend field names and data collection, progressively disclose optional fields, review the exact visible values, and require a separate submit action. Changed fields invalidate the review. Required fields reveal collapsed ancestors. Submit buttons start disabled until the enhancement is ready, preventing native GET submissions when JS is unavailable.
- Task brief has four initial fields; scope, support and terms remain required before saving. Cloud builder profile starts with four main fields; learning and discovery options remain separate explicit choices.
- Editable application, reply, delivery and feedback prompts do not replace existing input or send automatically. Agreements, review and portfolio controls remain human decisions. Private operation messages explain where the result is saved and when no email is sent.
- Opaque Sheets submissions no longer claim confirmed publication. Draft values remain visible and repeat-submit controls remain stopped after a sent request. Search questions no longer post a conciergeRequest record.
- People cards support keyboard opening and dialog focus management. Samples explicitly identify themselves; sample profiles do not offer real email contact.
- Public admin HTML is informational only; no review queues, publishing tools or privileged UI. Existing authorized private moderation workflows remain in Sheets/Supabase. This is not a new admin authentication system.
- Account progress uses already-authorized participant records and counts invitations, applications, conversations, confirmed agreements, deliveries, completions and received reviews. Counts overlap and are not claimed as a conversion rate. No analytics service, private-text collection or tracking cookies added.

## Public discovery and search

The Worker serves /opportunities/ and /builders/ plus stable /opportunities/{public-card-id} and /builders/{public-card-id} pages. Only the existing discoverPublic API is called; visitor headers/credentials are not forwarded. Server output whitelists public card fields and escapes text. It contains no private brief, account profile, review, message or contact. Withdrawn/paused cards are rechecked and not served from a persistent cache. Empty lists are noindex, missing cards are 404, provider/lookup-budget errors are 503 with noindex/Retry-After. Lookups are bounded to ten pages (200 cards) and an eight-second request budget; use a dedicated public-card lookup API before scaling beyond that. No synthetic people or tasks fill empty lists.

The legacy journey URL redirects to / with 301 on the hosted Worker; its static HTML fallback remains functional. All HTML pages have descriptions, canonical URLs, robots directives and Open Graph metadata. A native 1200×630 PNG supplies consistent share previews. Organization/WebSite and public-page breadcrumb JSON-LD describe actual visible content; no fake reviews/events/jobs are marked up. robots.txt and sitemap.xml include 28 intended public entry URLs, excluding personal tools, experiments, admin and internal search.

Run `python3 scripts/build-search-metadata.py --site-url https://YOUR-FINAL-HOST` for a final domain. Also update the explicit public-directory origin and existing backend origin/redirect allowlists in a separately reviewed domain rollout. No DNS, Auth redirect or origin-policy changes are part of this release. Search inclusion and AI citations are not guaranteed.

Regenerate the native share asset with `swift -module-cache-path /tmp/fb-swift-module-cache scripts/build-social-card.swift` on macOS. No external image/font downloads are needed.

## Verification

- 410 full regression tests pass, plus targeted form/discovery tests after the final no-JS safeguard.
- 66-page static link, asset, anchor and unique-ID validation passes.
- New tests cover explicit review before submission, stale-review invalidation, required-field disclosure, account-scoped metrics, safe publication acknowledgements, routing/index policy, public field allowlists, escaping, no credential forwarding, withdrawal, bounded pagination, methods, invalid input and safe errors.
- Live read-only checks against Founders & Builders project ijvokvffhcvakaultzfk confirmed the existing discovery operation responds with only the approved public schema. Both discovery types were empty during the test; no fixture records were created or user data changed.
- Existing HTML Content Security Policies were compared with the parent revision and retained. Backend, Auth, RLS, grants, Resend and Sheets configuration unchanged; JIDOKA repository/database untouched.
- Browser inventory reports local browser use disabled in Work settings. Desktop/mobile visual acceptance, keyboard checks in a real browser, Core Web Vitals and actual user conversion baselines remain pending. The share PNG was visually inspected independently.

## Before wider public launch

1. Confirm final domain, operator/legal identity and dedicated support/privacy contact. The published beta notices accurately describe known behavior and explicitly identify unfinished operator procedures; they are not represented as finalized public legal terms.
2. Finalize retention, account-deletion/support procedures and the beta approval notification/timeframe. No approval emails or guaranteed review times were invented.
3. Verify public crawler access through hosting, domain ownership and Search Console/Bing tools. Publishing metadata does not establish indexing or analytics access.
4. Complete desktop/mobile usability and real-device performance review. Existing two-account cloud checks should be repeated by participants after this presentation rollout.
5. Data remains in its original authorized stores. Older device/Sheets identities are not automatically merged with authenticated accounts. Public discovery opt-in remains separate from the private builder profile.
