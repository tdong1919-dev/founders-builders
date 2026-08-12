# Founders & Builders — data schema

This is the schema reference for the Google Sheet that backs every hub. It's generated
from (and must stay in sync with) the `ENTITIES` map in [`Code.gs`](Code.gs) — that file
is the source of truth; this doc is the human-readable version.

One Google Sheet is the datastore for the whole platform. Each entity below gets its own
tab, created automatically (with a frozen header row) the first time a record is read or
written for it. There is no separate "database" beyond this sheet — see the main
[README](../README.md#google-sheets-backend) for how the single Apps Script Web App
routes every hub's reads/writes to the right tab via a `type` parameter.

## Conventions

These apply across every entity unless a table below says otherwise:

| Field pattern | Type | Notes |
|---|---|---|
| `id` | string | Server-generated, 8-char UUID slice. Never sent by the client. |
| `timestamp` | string | Server-generated, ISO 8601 (`new Date().toISOString()`). Never sent by the client. |
| `email` | string | Validated as an email format client-side before submit. |
| `website`, `linkedin`, `x`, `instagram`, `github`, `portfolio`, `link`, `applyLink`, `rsvpLink`, `listenLink` | string (URL) | Protocol optional on entry (`example.com` is accepted); normalized to `https://` client-side when rendered as a link. |
| `mentor`, `investor`, `podcast`, `speaker`, `volunteer`, `hiring`\*, `remote` | string ("Yes" \| "") | Booleans are stored as the literal string `"Yes"` or an empty string, not `true`/`false`. \*`hiring` on `business` is a 3-way enum, not a boolean — see its table. |
| `skills`, `products`, `services`, `stages`, `industries`, `expertise`, `topics` | string (comma-list) | A single comma-separated string (e.g. `"Idea, MVP, Seed"`), split into tags client-side. Free text — not validated against an enum. |
| `location` | string (free text) | Used on individual profile/job-style entities (`profile`, `job`). Not restricted to the chapter list — a member or job can be anywhere. |
| `city` | string (enum) | Used on event/collab/podcast-style entities. On `event` this is a real enum tied to the platform's chapter list (see below); on `collab`/`podcast` it's currently free text in the form but conventionally uses the same values. |
| `category` / `type` / `format` / `stage` / `urgency` / `hiring` / `lookingFor` | string (enum) | Backed by a fixed `<select>` on the front end. The Apps Script backend validates these server-side as of the `enums` map in `Code.gs` — a submission with a value outside the allowed list is rejected with `{ ok: false, error: "Invalid value for: <field>" }`. |

Public hub entities now also receive shared network/moderation columns when the Apps
Script creates or migrates a sheet tab: `ownerKey`, `accountEmail`, `chapter`,
`moderationStatus`, `verified`, `reportCount`, `expiresAt`, and `lastUpdated`. Existing
tabs are not reset; missing headers are appended to the right of the current header row.

**Required fields** are enforced server-side; a submission missing any of them is rejected
with `{ ok: false, error: "Required: <fields>" }`. All other fields are optional and
default to an empty string if omitted.

**Honeypot**: every write form includes a hidden `company_website` field. If it's
non-empty (a bot filled it in), the backend silently returns `{ ok: true }` without
writing a row.

---

## `profile` — sheet `Profiles` (Member Profiles hub)

Required: `name`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| name | string | |
| building | string | What they're building |
| business | string | Company/project name |
| stage | enum | `Idea` · `Pre-launch` · `MVP / Beta` · `Early revenue` · `Growth` · `Scaling` · `Established` |
| products | string (comma-list) | |
| skills | string (comma-list) | |
| industry | string | |
| location | string (free text) | |
| email | string | |
| website, linkedin, github, x, portfolio | string (URL) | |
| bio | string | |
| goals | string | |
| lookingFor | string | |
| canHelp | string | |
| mentor, investor, podcast, speaker, volunteer | boolean-ish | |
| needs | string (comma-list) | Structured "What I need" tags for matchmaking |
| offers | string (comma-list) | Structured "What I can help with" tags for matchmaking |
| ownerKey, accountEmail, chapter, moderationStatus, verified, reportCount, expiresAt, lastUpdated | string | Shared network/moderation columns |

## `business` — sheet `Businesses` (Business Directory hub)

Required: `name`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| name | string | |
| category | enum | `Startup` · `Small business` · `Agency` · `Nonprofit` · `Freelancer` · `Service provider` · `Product` · `Software` · `Physical product` |
| logo | string (URL) | Image URL |
| description | string | |
| website | string (URL) | |
| industry | string | |
| team | string | Team size (this is what renders in the card's location slot — there is no separate business location field) |
| products, services | string (comma-list) | |
| hiring | enum | `Hiring now` · `Not currently hiring` · `Open to great people` |
| email | string | |
| linkedin, x, instagram | string (URL) | |

## `listing` — sheet `Listings` (Marketplace hub)

Required: `name`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| name | string | |
| category | enum | `Software` · `SaaS` · `AI tools` · `Marketing services` · `Consulting` · `Graphic design` · `Web development` · `Manufacturing` · `Coaching` · `Courses` · `Templates` · `Books` · `Physical products` |
| description | string | |
| pricing | string (free text) | e.g. "$29/mo", "Contact for pricing" |
| image, demo | string (URL) | |
| website | string (URL) | |
| email | string | |

## `job` — sheet `Jobs` (Jobs & Opportunities hub)

Required: `title`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| title | string | |
| company | string | |
| category | enum | `Full-time` · `Part-time` · `Contract` · `Freelance` · `Internship` · `Volunteer` · `Fractional` · `Apprenticeship` · `Co-founder` · `Advisory board` |
| location | string (free text) | |
| remote | boolean-ish | |
| compensation | string (free text) | |
| description | string | |
| applyLink | string (URL) | |
| email | string | |

## `mentor` — sheet `Mentors` (Mentor Network hub)

Required: `name`, `email`

No enum fields — `stages` is a free-text comma-list, not a fixed select.

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| name, title, company | string | |
| industry | string | |
| expertise, stages | string (comma-list) | |
| experience, availability, officeHours | string (free text) | |
| bio | string | |
| email | string | |
| linkedin, website | string (URL) | |

## `help` — sheet `Help` (Help Board hub)

Required: `title`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| name | string | Optional — who's asking |
| title | string | The headline ask |
| category | enum | `Technical co-founder` · `Beta testers` · `Intro / connection` · `Legal` · `Sales / customers` · `Feedback on MVP` · `Design` · `Marketing` · `Funding` · `Other` |
| urgency | enum | `ASAP` · `This month` · `No rush` |
| description | string | |
| email | string | |
| linkedin | string (URL) | |

## `raise` — sheet `Raises` (Funding Hub — raising side)

Required: `company`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| company, founder | string | |
| stage | enum | `Idea` · `Pre-seed` · `Seed` · `Series A` · `Series B+` · `Bridge / Note` |
| industry | string | |
| amountSeeking, raisedSoFar, useOfFunds | string (free text) | |
| description | string | |
| email | string | |
| website, linkedin | string (URL) | |

## `investor` — sheet `Investors` (Funding Hub — investing side)

Required: `name`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| name, firm | string | |
| type | enum | `Angel` · `VC Fund` · `Family Office` · `Syndicate` · `Corporate VC` · `Accelerator` |
| checkSize | string (free text) | |
| stages, industries | string (comma-list) | |
| thesis | string | |
| email | string | |
| website, linkedin | string (URL) | |

## `event` — sheet `Events` (Community Calendar hub)

Required: `title`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| title, host | string | |
| category | enum | `Workshop` · `Meetup` · `AMA` · `Demo Day` · `Pitch Competition` · `Office Hours` · `Hack Night` · `Panel` · `Other` |
| city | enum | `Boise, ID` · `Atlanta, GA` · `Washington, DC` · `Madison, AL` · `Virtual` · `Other` — this is the platform's canonical chapter list |
| date | string (`YYYY-MM-DD`) | Powers both the list view's date sort and the month calendar view's grid placement |
| time | string (free text) | e.g. "6:00 PM MT" |
| location | string (free text) | Venue address or call link |
| description | string | |
| rsvpLink | string (URL) | Can point to Eventbrite, Luma, Meetup, or any external RSVP page |
| email | string | |

## `collab` — sheet `Collabs` (Co-Host & Collaborate hub)

Required: `title`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| title | string | |
| name | string | Optional — who's proposing |
| category | enum | `Event` · `Workshop` · `AMA` · `Meetup` · `Cross-promotion` · `Podcast episode` · `Project` · `Other` |
| format | boolean-ish | `"Virtual"` or empty — rendered as a "Virtual" badge |
| city | string (free text) | Not currently a fixed select on this form |
| description | string | |
| email | string | |
| linkedin | string (URL) | |

## `podcast` — sheet `Podcasts` (Podcast Hub)

Required: `showName`, `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| showName, host | string | |
| topics | string (comma-list) | |
| format | enum | `Interview` · `Solo` · `Co-hosted` · `Panel` |
| lookingFor | enum | `Guests` · `Co-host` · `Sponsors` · `Not right now` |
| city | string (free text) | Not currently a fixed select on this form |
| description | string | |
| listenLink | string (URL) | |
| email | string | |
| linkedin | string (URL) | |

## `resource` — sheet `Resources` (Resource Library hub)

Required: `title`, `link` (this is the one entity that does **not** require `email`)

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| title | string | |
| category | enum | `Template` · `Playbook` · `AI Prompt` · `Startup Guide` · `Grant Database` · `Accelerator Database` · `Checklist` · `SOP` · `Software / Tool` · `Other` |
| description | string | |
| link | string (URL) | The resource itself — cards link straight out to this, no detail modal |
| submittedBy | string | Optional attribution |
| email | string | Optional — for follow-up, not required |

## Connected platform entities

These tabs support the new dashboard, identity, saved items, reporting, admin review,
concierge, seed-content, and network graph features. They preserve the current static
site + Google Sheets architecture and avoid adding a separate database.

### `account` — sheet `Accounts`

Required: `email`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| ownerKey | string | Device-generated local identity key |
| name, email, chapter, location | string | Lightweight identity fields |
| needs, offers, goals, skills | string | Used by dashboard and matchmaking |
| lastSeen | string | Optional timestamp/client signal |
| moderationStatus | enum-ish | Defaults to `Active` |

### `savedItem` — sheet `Saved Items`

Required: `targetType`, `targetId`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| ownerKey, accountEmail | string | Links save to lightweight identity |
| targetType, targetId, targetTitle | string | Saved hub record |
| notes | string | Optional |

### `report` — sheet `Reports`

Required: `reason`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| targetType, targetId, targetTitle | string | Record being reported |
| reason | enum | `Spam` · `Duplicate` · `Outdated` · `Inaccurate` · `Safety concern` · `Funding or investor concern` · `Other` |
| details | string | Reporter-provided context |
| reporterEmail | string | Optional |
| status | enum | `Open` · `Reviewing` · `Resolved` · `Dismissed`; defaults to `Open` |

### `adminAction` — sheet `Admin Actions`

Required: `action`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| targetType, targetId, targetTitle | string | Reviewed record |
| action | enum | `Reviewed` · `Verified` · `Needs follow-up` · `Marked duplicate` · `Hidden in Sheet` · `Rejected in Sheet` |
| notes, adminEmail | string | Append-only audit note |

### `chapter` — sheet `Chapters`

Required: `name`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| name, city, slug | string | Chapter identity |
| status | enum | `Launch chapter` · `Pilot` · `Planning` · `Paused` |
| focus | string | Local ecosystem focus |
| leadName, leadEmail, notes | string | Optional |

### `activity` — sheet `Activity`

Required: `title`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| title, summary | string | Curated action-feed item |
| targetType, targetId | string | Optional linked record |
| chapter | string | Optional chapter |
| actionLabel, actionUrl | string | Where the item should point |
| status | string | Defaults to `Active` |

### `graphEdge` — sheet `Graph Edges`

Required: `sourceTitle`, `relationship`, `targetTitle`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| sourceType, sourceId, sourceTitle | string | Source node |
| relationship | string | e.g. `needs`, `can help with`, `chapter`, `seeking` |
| targetType, targetId, targetTitle | string | Target node |
| basis | string | Human-readable evidence for the edge |
| weight | string/number | Optional scoring signal |

### `conciergeRequest` — sheet `Concierge Requests`

Required: `question`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| question | string | User's Ask F&B prompt |
| email | string | Optional requester email |
| context | string | Optional |
| matchedTypes | string | Hub types returned by the local concierge |
| status | string | Defaults to `Open` |
| notes | string | Optional follow-up |

### `seedTemplate` — sheet `Seed Templates`

Required: `title`, `targetType`

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| title, targetType | string | Template or seed batch name |
| sourcePolicy | string | Permission/source requirements |
| templateUrl | string (URL) | Optional source template |
| permissionStatus | string | Defaults to `Template only` |
| moderationStatus | string | Defaults to `Needs review` |
| notes | string | Optional |
