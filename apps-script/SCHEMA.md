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

## Admin security

Private admin reads and privileged writes are protected by an Apps Script token stored in
Script Properties as `FB_ADMIN_TOKEN`. Run `setAdminToken("long-random-token")` once in
the Apps Script editor, redeploy the Web App, then paste that token into `admin.html` on
your own device.

Protected operations include:

- Reading private queue tabs such as `Event Sources`, `Reports`, and `Admin Actions`.
- Writing `adminAction`, `chapter`, `activity`, `graphEdge`, or `seedTemplate` rows.
- Publishing imported external events that include source attribution fields.
- Updating existing rows through the admin-only `adminOperation: "updateRecord"` path.
- Fetching a public iCal feed through `?action=fetchIcal`.

Public member-facing submissions still work without an admin token.

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
| sourcePlatform | string | External platform label, e.g. `Luma`, `Meetup`, `Eventbrite`, `Partiful`, `Google Calendar`, `iCal feed`, or `Other website`. Blank for native F&B posts. |
| sourceName | string | Organizer/source name to show for attribution. |
| sourceUrl | string (URL) | Public source calendar, organizer, or event URL. |
| sourceEventId | string | Optional event ID from the original platform. |
| importStatus | string | Review/import state for aggregated events, e.g. `Pending review`, `Approved`, `Imported`, `Skipped`, or `Error`. |
| importedFromSourceId | string | Optional ID linking the event to an `eventSource` row. |
| externalUpdatedAt | string | Optional timestamp from the original source for sync comparisons. |

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

### `eventSource` — sheet `Event Sources`

Required: `sourceName`, `organizerEmail`, `platform`, `authMethod`,
`permissionConfirmed`, `attributionAccepted`, `reviewAccepted`

This is the private intake queue for event aggregation sources. It stores organizer
metadata, source URLs, permission acknowledgements, review state, and next steps. It does
**not** store OAuth tokens, API keys, passwords, or private guest data. Store approved
secrets in Apps Script Properties with the helper functions in `Code.gs`, then update the
row's `secretStatus` manually.

| Column | Type | Notes |
|---|---|---|
| id, timestamp | — | see conventions |
| sourceName | string | Organizer/community/calendar name |
| organizerEmail | string | Organizer/admin contact email |
| contactName | string | Optional human contact |
| platform | enum | `Luma` · `Meetup` · `Eventbrite` · `Partiful` · `Google Calendar` · `iCal feed` · `Other website` · `Other` |
| authMethod | enum | `Public calendar/feed URL` · `Public organizer/event URL` · `OAuth setup request` · `API key setup request` · `Manual review only` |
| chapter | string | Primary chapter or location |
| sourceUrl, feedUrl | string (URL) | Public URLs only; do not paste private tokenized feed URLs without admin approval |
| importMode | enum | `Curated review` · `Auto-sync when supported` · `Manual submission`; defaults to `Curated review` |
| cadence | enum | `Occasional` · `Weekly` · `Monthly` · `Quarterly` · `Unknown` |
| fitNotes | string | What kinds of events should be imported |
| permissionConfirmed, attributionAccepted, reviewAccepted | string ("Yes" \| "") | Organizer acknowledgements required by the intake form |
| syncStatus | enum | `Requested` · `Needs secure setup` · `Pending review` · `Active` · `Paused` · `Rejected` · `Error`; defaults to `Pending review` |
| approvalStatus | enum | `Pending review` · `Approved` · `Rejected` · `Paused`; defaults to `Pending review` |
| secretStatus | enum | `Not collected - admin follow-up required` · `No secret required` · `Stored in Script Properties` · `Revoked`; defaults to `No secret required` |
| lastChecked | string | Optional last sync/review timestamp |
| lastImportCount | string/number | Optional count from the most recent import |
| nextStep, notes | string | Admin follow-up and review notes |
| providerAccountId | string | Optional provider account/user ID for OAuth/API setup; not a secret |
| providerCalendarId | string | Optional provider calendar ID; not a secret |
| providerOrganizationId | string | Optional provider organization/group ID; not a secret |
| providerEndpoint | string | Provider endpoint or public feed URL used by the connector plan |
| providerScope | string | Plain-English scope, e.g. `Read current/future organization events only` |
| oauthStatus | string | Admin-tracked OAuth/API status; do not store credential values here |
| connectorStatus | string | Admin connector state such as `Needs secure setup`, `Active`, `Paused`, or `Error` |
| lastProviderSyncAt | string | Optional timestamp for future automated sync runs |
| providerNotes | string | Non-secret connector notes |

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
| action | enum | `Reviewed` · `Verified` · `Needs follow-up` · `Marked duplicate` · `Hidden in Sheet` · `Rejected in Sheet` · `Event source approved` · `Event source rejected` · `Event source paused` · `Event source needs secure setup` · `Event source ready for manual import` · `Imported events from source` · `Archived expired events` · `Configured provider connector` |
| notes, adminEmail | string | Append-only audit note |
| recommendedApprovalStatus | enum | Optional event-source review recommendation: `Pending review` · `Approved` · `Rejected` · `Paused` |
| recommendedSyncStatus | enum | Optional event-source review recommendation: `Requested` · `Needs secure setup` · `Pending review` · `Active` · `Paused` · `Rejected` · `Error` |
| recommendedSecretStatus | enum | Optional event-source review recommendation: `Not collected - admin follow-up required` · `No secret required` · `Stored in Script Properties` · `Revoked` |
| importPlan | enum | Optional event-source import plan: `No import yet` · `Manual import approved` · `Curated review only` · `Auto-sync when supported` · `Needs organizer follow-up` |
| sourcePlatform, sourceUrl, feedUrl, organizerEmail | string | Optional event-source context copied into the audit note row |
| importCount | string/number | Optional count for manual import audit notes |
| duplicateCount | string/number | Optional count of possible duplicate imports detected in a preview |
| archivedCount | string/number | Optional count for expiration cleanup notes |
| adminOperation | string | Used internally by protected admin row-update requests such as `updateRecord` |
| provider, providerOperation | string | Optional connector audit context |

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
