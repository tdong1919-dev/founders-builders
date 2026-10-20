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

The local functional/security suites and shared navigation checks pass. All 40 HTML pages were checked for duplicate IDs, missing local stylesheet/script/link targets and consistent branding/navigation. No connected browser was available during this redesign, so desktop/mobile visual inspection remains pending. Changes belong in a separate review PR stacked on the workspace PR, with no production merge or deployment.
