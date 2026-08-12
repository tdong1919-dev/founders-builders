# 🚀 Founders & Builders

The home base for builders and entrepreneurs — a practical, community-built ecosystem
where founders, developers, designers, marketers, operators, investors, students, and
creators find opportunities, connect with the right people, and help each other build
successful companies.

> We are not trying to build another social network. We're building a practical,
> collaborative ecosystem that helps builders spend less time searching across fragmented
> platforms and more time building meaningful relationships and successful companies.

This repository currently holds the **marketing landing site** that presents the platform
vision and gathers early community feedback.

## The vision at a glance

- 👤 **Member Profiles** — what you're building, skills, stage, and what you're looking for
- 🏢 **Business Directory** — searchable listings for startups, agencies, nonprofits & freelancers
- 🛍️ **Products & Services Marketplace** — promote and support each other's work
- 💼 **Jobs & Opportunities** — a community job board, incl. co-founder & advisory roles
- 🤝 **Mentor Network** — request a mentor or become one
- 🆘 **HAAALLLPPPPP!** — a help board for exactly what you need right now
- 🎤 **Co-Host & Collaborate** — events, workshops, AMAs, cross-promotion
- 🎙️ **Podcast Hub** — find guests, hosts, and local shows
- 💰 **Funding Hub** — founder ↔ investor matching (AI-assisted)
- 📅 **Community Calendar** — F&B posts plus reviewed external sources from organizer platforms
- 💕 **Founder Diagnostic** — JIDOKA-powered bottleneck assessment for post-MVP founders
- 📚 **Resource Library** — templates, playbooks, prompts, grant & accelerator databases
- 📖 **Philosophical Topic Generator** — *"Do Not Open If You Want Peace"*
- 🧭 **Member Dashboard + Universal Search** — persistent identity, saved items & cross-hub discovery
- 🤖 **Matchmaker + Ask F&B** — rule-based recommendations and a concierge grounded in current records
- 🛡️ **Trust & Moderation** — reporting, admin action notes, seed-content policy & funding disclaimers
- 🗺️ **City Chapters + Network Intelligence** — DC, Atlanta, Boise, Madison, activity feed & graph layer

## Tech

Plain, dependency-free **HTML / CSS / JavaScript** — no build step, no framework.

```
index.html            # landing page
styles.css            # design system & landing layout
script.js             # nav, scroll reveals, topic generator, waitlist form

profiles.html         # 👤 Member Directory (hub #1)
create-profile.html   # profile creation form
profiles.js           # directory + form logic (reads/writes the sheet)

business.html         # 🏢 Business Directory (hub #2)
add-business.html     # business listing form
business.js           # directory + form logic (reads/writes the sheet)

marketplace.html      # 🛍️ Marketplace (hub #3)
add-listing.html      # product/service listing form
marketplace.js        # directory + form logic (reads/writes the sheet)

jobs.html              # 💼 Jobs & Opportunities (hub #4)
add-job.html           # job/opportunity posting form
jobs.js                # directory + form logic (reads/writes the sheet)

mentors.html           # 🤝 Mentor Network (hub #5)
become-mentor.html     # mentor signup form
mentors.js             # directory + form logic (reads/writes the sheet)

help.html              # 🆘 Help Board (hub #6)
add-help.html          # post-a-need form
help.js                # directory + form logic (reads/writes the sheet)

funding.html           # 💰 Funding Hub — raising + investing boards (hub #7)
add-raise.html         # founder raise intake form
add-investor.html      # investor intake form
funding.js             # both directories + both forms (reads/writes the sheet)

calendar.html          # 📅 Community Calendar (hub #8)
add-event.html         # event posting form
add-event-source.html  # organizer calendar/source authorization request form
calendar.js            # directory + form logic (reads/writes the sheet)
event-sources.js       # event-source intake flow (private admin review queue)

collaborate.html       # 🎤 Co-Host & Collaborate (hub #9)
add-collab.html        # collab posting form
collaborate.js         # directory + form logic (reads/writes the sheet)

podcasts.html          # 🎙️ Podcast Hub (hub #10)
add-podcast.html       # podcast listing form
podcasts.js            # directory + form logic (reads/writes the sheet)

resources.html         # 📚 Resource Library (hub #11)
add-resource.html      # resource submission form
resources.js           # directory + form logic (reads/writes the sheet)

dashboard.html         # unified member dashboard + persistent local identity
search.html            # universal search across all 11 hubs
concierge.html         # Ask F&B community concierge
chapters.html          # DC / Atlanta / Boise / Madison chapter dashboards
activity.html          # action-oriented opportunities feed
network.html           # explainable network intelligence graph
admin.html             # trust, report queue, admin action notes
report-listing.html    # listing report intake
platform.js            # shared data, identity, search, matchmaking, graph logic
platform.css           # shared styles for connected platform pages
seed-content/          # seed/import policy and intake templates

profiles.css          # shared hub styling (cards, modal, forms, toolbar)
config.js             # paste your Apps Script Web App URL here (shared by all hubs)
apps-script/Code.gs   # Google Sheets backend — one Web App serves every hub
apps-script/SCHEMA.md # Full schema reference: every entity's columns, types, enums
```

## Google Sheets backend

Every hub uses the **same Google Sheet** as its datastore via **one Google Apps Script
Web App** — no server or paid database required, and it works from GitHub Pages. Each hub
gets its own tab (`Profiles`, `Businesses`, …), routed by a `type` param, so you only
deploy once no matter how many hubs get added.

**One-time setup:**

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Delete any code, paste all of [`apps-script/Code.gs`](apps-script/Code.gs), and Save.
3. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Copy the **Web app URL** (ends in `/exec`).
5. Paste it into [`config.js`](config.js) as `PROFILES_API`, commit, and push.

**When `apps-script/Code.gs` changes** (e.g. a new hub is added), update the existing
deployment rather than creating a new one — the URL in `config.js` stays valid:
**Deploy → Manage deployments → Edit (pencil) → Version: New → Deploy**.

Each sheet tab and its headers are created automatically on first use. Existing tabs are
migrated safely: when new columns are added to `Code.gs`, the script appends missing
headers instead of replacing old data. Until
`config.js` is set, every hub shows sample data and forms run in demo mode (nothing is
saved).

For admin features, run `setAdminToken("long-random-token")` in Apps Script after
deploying `Code.gs`, redeploy the Web App, then paste that token into `admin.html`.
Private queues, external-event imports, iCal fetching, cleanup, connector setup, and
admin action notes require this token. Public member submissions do not.

**Event aggregation:** organizers can submit external event sources through
[`add-event-source.html`](add-event-source.html). The request goes to a private
`Event Sources` tab for review; approved external events appear in the public `Events`
tab with source attribution and RSVP links back to the original platform. Admins can
review selected source requests in [`admin.html`](admin.html), which records append-only
review actions and recommended status changes. Approved sources can then be used in the
manual import queue to paste iCal/JSON/CSV/text events or fetch a public iCal feed,
preview/edit parsed events, detect duplicates, publish selected rows, archive expired
events, and track provider connector readiness for Luma, Meetup, Eventbrite, Partiful,
Google Calendar, iCal, and other websites. The operating guide is in
[`docs/EVENT_SOURCE_AGGREGATION.md`](docs/EVENT_SOURCE_AGGREGATION.md).

**Schema:** every entity's exact columns, types, required fields, and allowed values
(enums) are documented in [`apps-script/SCHEMA.md`](apps-script/SCHEMA.md) — that's the
place to look before adding a field or a new hub. The backend validates required fields
and enum values server-side, so a submission with a bad category/stage/type value is
rejected rather than silently written.

## Supabase migration

The project now has a Supabase database foundation under `fb_`-prefixed tables, with
RLS, indexes, seeded launch chapters, event import run tables, and a migration bridge
from the current Google Sheets/App Script backend. The live frontend remains pointed at
Google Sheets through `DATA_BACKEND: "google-sheets"` until migrated data is verified.

See [`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md) for the table list,
service-role migration command, security notes, and cutover process.

**How it works:** each directory **reads** via JSONP (bypasses CORS, `?type=<hub>`), and
each form **writes** by POSTing `{ type: "<hub>", ... }` to the same endpoint. A hidden
honeypot field on every form filters basic spam bots.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (GitHub Pages)

1. Push to `main`.
2. In the repo: **Settings → Pages → Build from a branch → `main` / `root`**.
3. Your site goes live at `https://<user>.github.io/buildersandentrepreneurs/`.

## Roadmap

- [x] Landing site presenting the vision
- [x] **👤 Member Profiles** — directory + create form, Google Sheets backend
- [x] **🏢 Business Directory** — directory + listing form, Google Sheets backend
- [x] **🛍️ Products & Services Marketplace** — listings + "book a consultation", Google Sheets backend
- [x] **💼 Jobs & Opportunities** — job board with apply/contact CTAs, Google Sheets backend
- [x] **🤝 Mentor Network** — mentor directory + signup form, Google Sheets backend
- [x] **🆘 Help Board** — post-a-need board with category/urgency filters, Google Sheets backend
- [x] **💰 Funding Hub** — raising + investing boards, Google Sheets backend (AI-assisted matching is a future upgrade)
- [x] **📅 Community Calendar** — event listings plus reviewed external source intake, Google Sheets backend
- [x] **🎤 Co-Host & Collaborate** — collab board for events, workshops, AMAs & cross-promotion, Google Sheets backend
- [x] **🎙️ Podcast Hub** — show directory, find guests/co-hosts/sponsors, Google Sheets backend
- [x] **📚 Resource Library** — templates, playbooks, prompts & tools, Google Sheets backend
- [x] **Member dashboard** — device-level persistent identity, saved items, my records
- [x] **Universal search** — one search surface across all 11 hubs
- [x] **Needs/offers profile mechanic** — structured `needs` and `offers` signals
- [x] **Matchmaking engine** — rule-based recommendations grounded in current records
- [x] **Ask F&B** — concierge-style search assistant without fabricated matches
- [x] **Trust/moderation infrastructure** — reports, admin action log, status fields
- [x] **Seed-content infrastructure** — import policy and review template, no fabricated people
- [x] **City chapters** — DC, Atlanta, Boise, Madison, plus virtual/remote support
- [x] **Action-oriented activity feed** — opportunities and asks, not a social feed
- [x] **Network intelligence layer** — explainable graph of people, companies, skills, needs, capital, events, resources, and relationships

Contributions and feedback welcome — **the door is open. Let's build this together.**
