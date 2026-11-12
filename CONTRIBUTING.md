# Contributing

We welcome concrete feedback on founder, builder, and owner-agent journeys. The repository is public; use only sanitized examples and read the [current exposure review](docs/PUBLIC_EXPOSURE_REVIEW_20261112.md). No open-source license is introduced here; code reuse and outside code contributions need a clear permission/license position first.

## Useful proposals

Open an issue with the user problem, page/stage, expected behavior, and a small acceptance criterion. Use synthetic examples. Do not attach private ideas, messages, account identifiers, credentials, or production exports. Security concerns belong privately at **support@getjidoka.com**, with a minimal reproduction and no private data.

Review [the roadmap](ROADMAP.md). For agent work, state who authorizes each action and what evidence closes the checkpoint.

See the [engineering guide](docs/ENGINEERING_GUIDE.md) for folder responsibilities and trust boundaries. Do not move runtime files merely to tidy the presentation: flat page/module paths are used by the existing site and asset builder. A structural refactor needs its own scoped change and regression review.

## Local development

Use Python 3 and a modern browser. No frontend bundler is required:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Try `quick-tour.html` or `shared-workspace.html` with fictional content only. Static hosting does not run hosted discovery routes or configure Supabase. The optional `node server/run-local.mjs` service requires Node.js with `node:sqlite`; it binds to loopback and provides synthetic sessions, not production authentication. Never expose it publicly.

## Verification and review

Run checks relevant to the change. Full local checks:

```bash
node --test tests/*.test.cjs
python3 scripts/check-static-pages.py
git diff --check
```

Local-store tests require `node:sqlite`. Local tests do not prove live Auth/RLS, external-host access, or browser layout. UI changes need representative desktop/mobile and keyboard review. Provider deployments, live email, SQL, and agent mutation tests require separately authorized hosted acceptance.

Keep PRs focused. Explain the user problem, resulting behavior, validation, and limits. Keep implementation, merge, and deployment distinct. Explain costs and scope before adding dependencies, recurring services, or permissions.

Preserve these boundaries:

- Server-side identity and authorization protect private records; browser controls are insufficient.
- Public fields require owner approval. Participant/agent content remains untrusted input.
- No server keys, agent credentials, sign-in links, backups, or private records in frontend code, tests, issues, screenshots, or logs.
- Agent authority stays explicit, bounded, revocable, and attributable; test denied paths.
- Current human approvals remain required for agreements, grants, reviews, and portfolio sharing.
- Completion does not verify payment; compensation is directly between participants.
- Collaboration notifications and Sheets submissions stay off until separate activation checks pass.
- Protocol, automation, and adoption claims must match recorded evidence.

## Deployment

Push/merge does not prove a live release. Frontend Worker/Sites assets, Edge Functions, and migrations have separate lifecycles. Use the reviewed asset allowlist rather than uploading the entire repository or enabling root GitHub Pages. Internal source, fixtures, and operational records must not accidentally become website assets.
