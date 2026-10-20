# Founders & Builders: living network, shared work

The home page is the visual and editorial foundation. Keep its warm off-white surfaces, graphite text, restrained indigo, sparing warm gold, IBM Plex Sans, rocket mark and quiet borders. `styles.css` owns design tokens; `brand-system.css` applies them to older prototype screens. Font files and their SIL Open Font License are in `assets/fonts`.

The central product story is **bring an idea → find contributors → build something together**. A living network gives people reasons to connect, context for a useful contribution, and a way to stay involved as the work changes. Introductions and recommendations support that journey. Do not lead with matching scores, swiping, a people database, or a catalogue of unrelated tools. Do not imply that automatic network learning or real shared accounts are live before they are implemented.

## Information hierarchy

Four primary destinations stay consistent across the site:

- **Build together:** public project opportunities and a route into shaping an idea.
- **People:** community members, their work and capabilities.
- **Community:** mentors, help, businesses, products/services, jobs, funding, events, chapters, podcasts, resources and supporting tools.
- **Workspace:** the place to plan and follow shared work; real member accounts remain deferred.

The home page gives two starting points: bring an idea or bring your strengths. It explains the progression from context to contribution to a small milestone. Supporting community features stay reachable without competing with that first decision. `community-vision.html` preserves the earlier broad vision and illustrative examples; it is not the primary onboarding experience.

## Implementation boundaries

The original Sheets/Apps Script public hubs remain intact. The private workspace remains disabled pending real auth and RLS verification. The fictional preview remains a separately labeled, in-memory entry point; it does not replace actual accounts or validate database security.

`navigation.js` owns shared menu behavior and has no storage, authentication, analytics or API behavior. `script.js` no longer injects extra top-level destinations. All branded pages load the same four-link navigation and common font stylesheet. Regenerate `workspace-preview.html` from `workspace.html` after markup changes.

## Verification and delivery

The local functional/security suites and shared navigation checks pass. All 41 HTML pages were checked for duplicate IDs, missing local stylesheet/script/link targets and consistent branding/navigation. Focused browser review covered the home page, Community and workspace at desktop and mobile widths. Shared mobile navigation opened and closed correctly; those screens had no horizontal overflow. Review corrected text alignment and heading spacing, and moved existing collaborations ahead of a collapsed project-creation form. Creating a private project succeeded in the isolated fictional preview. All 44 JavaScript tests passed. This review does not establish real authentication or database security; Supabase remains deferred. The follow-up review below covers the remaining supporting pages. Changes belong in a separate review PR stacked on the workspace PR, with no production merge or deployment.


## Learning through contribution

Students, job seekers, career changers, and people practicing new skills belong in the existing contributor path. The product does not need a third primary path or a separate student network. `learn-by-building.html` connects a small task, feedback, a supported account of the work, and continued relationships. It is a guide, not a credential, automated résumé generator, or saved work-history feature. The fictional résumé example must remain labeled. Reuse existing optional profile fields and backend contracts; do not require a company or startup stage from a learner.

## Supporting-page review · 20 October 2026

Content review covered all remaining public hubs, forms, tools, administration, and the archived vision. Rendered layout checks at 1280 × 900 and 390 × 844 covered these 37 pages: profiles, projects, business, calendar, collaborate, funding, help, jobs, marketplace, mentors, podcasts, resources, activity, chapters, concierge, dashboard, network, search, build-together, idea-match, create-profile, add-business, add-collab, add-event-source, add-event, add-help, add-investor, add-job, add-listing, add-podcast, add-raise, add-resource, become-mentor, report-listing, admin, community-vision, and the new learn-by-building guide (all `.html`). Home, Community, workspace, and workspace preview were covered in the preceding focused review.

No horizontal document overflow was found at those widths. Offscreen honeypot fields and the archived horizontal feature carousel are intentional; they are not document overflow. Representative screenshot review covered the guide (including its complete mobile page), People, calendar, dashboard, network, mentors, concierge, admin, and profile/collaboration forms. Browser interaction confirmed the guide-to-profile route and the calendar view switch. A populated calendar revealed that long event names could widen one column and clip the final day; seven `minmax(0,1fr)` tracks now keep all weekdays visible. Back links, kickers, headings, and tool-container insets were also corrected.

All 44 JavaScript tests passed; all 41 HTML pages passed duplicate-ID and local-target checks. No submission was made to a public form during this review. Public listings in the local browser displayed their existing sample-data labels; this is not validation of a live Sheets deployment. The Sheets/Apps Script JavaScript, form field names, authentication client, configuration, and SQL migrations were not changed. No hosted service was enabled, upgraded, or deployed. Supabase and real multi-user verification remain deferred.
