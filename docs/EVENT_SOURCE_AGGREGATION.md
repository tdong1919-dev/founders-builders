# Event Source Aggregation

Founders & Builders can aggregate founder-related events from external platforms without
becoming another social feed. The right default is a review pipeline: organizers submit a
source once, F&B reviews permission and relevance, then approved events appear on the
calendar with clear attribution and RSVP links back to the original platform.

## Organizer Flow

1. Organizer opens `add-event-source.html`.
2. Organizer chooses a platform and connection method.
3. Organizer submits a public source URL or feed URL when one exists.
4. Organizer confirms permission, attribution, and review terms.
5. The request is written to the private `Event Sources` sheet tab as `eventSource`.
6. Admin reviews the request in `admin.html`.
7. Admin records a source-review action with the recommended approval/sync/secret status.
8. Admin updates the `Event Sources` row through the protected admin workflow or in
   Sheets and handles any secure setup outside the public form.
9. Admin uses the manual import queue to paste public event data or fetch a public iCal
   feed, preview parsed events, edit fields, and publish selected events.
10. Duplicate matches are unchecked by default and blocked from publishing until they
    are removed from the selected set.
11. Approved events are added to the public `Events` tab with source attribution fields.
12. Admin periodically archives expired events so the public calendar stays current.

## Build Order Implemented

1. **Manual Event Import Queue**: approved event sources can be selected in `admin.html`;
   admins can paste iCal, JSON, CSV, TSV, or labeled text event data and preview before
   publishing.
2. **Public iCal parser/importer**: admins can paste iCal text directly or fetch a public
   `.ics` URL through the Apps Script `fetchIcal` action. The fetcher requires the admin
   token and rejects local/private URLs.
3. **Duplicate detection**: previews compare source event IDs first, then normalized
   title/date/city fingerprints. Possible duplicates are unchecked and selected duplicates
   are blocked from publishing.
4. **Event expiration/archive cleanup**: admins can review past events older than a
   configurable number of days and mark selected rows `moderationStatus=Archived`.
5. **Secure admin auth**: private admin reads and privileged writes require the
   `FB_ADMIN_TOKEN` Script Property. Public submissions still work without the token.
6. **OAuth/API integration groundwork**: provider setup fields and audit actions track
   Luma, Meetup, Eventbrite, Partiful, Google Calendar, iCal, and other website connector
   readiness without storing credentials in Sheets.

## Connection Methods

| Method | Use when | Credential handling |
|---|---|---|
| Public calendar/feed URL | The organizer has a public iCal, Google Calendar, or platform feed URL | No secret required |
| Public organizer/event URL | Events can be reviewed from a public organizer page or event page | No secret required |
| OAuth setup request | The platform requires organizer account authorization | Do not collect tokens in the form; complete setup separately |
| API key setup request | The organizer/platform uses a key-based integration | Do not collect keys in the form; store approved keys securely |
| Manual review only | There is no stable feed/API yet, or the source needs human curation | No secret required |

## Platform Notes

- Luma: prefer public calendar/source URLs when available; otherwise treat as secure
  API setup. The public API uses `https://public-api.luma.com`; API-key access is
  documented by Luma and should be stored server-side only.
- Meetup: use public organizer/event URLs for curation when enough. OAuth/API access
  should be treated as a secure setup because Meetup's current API uses OAuth bearer
  tokens and GraphQL.
- Eventbrite: use public organizer/event URLs for curation when enough. API access
  requires OAuth/private tokens; use server-side OAuth and never put tokens in client
  code.
- Partiful and other websites: start with public URLs and manual review unless an
  official export, feed, or API path is available.
- Google Calendar and iCal: public feed URLs are the cleanest first version.

These platform capabilities can change, so verify the current provider documentation
before building automated importers.

## Admin Rules

- Do not store OAuth tokens, API keys, passwords, or private guest data in Google Sheets.
- Store approved secrets in Apps Script Properties using `setEventSourceSecret` from
  `apps-script/Code.gs`, or provider-specific values with
  `setEventSourceProviderCredential(sourceId, provider, secretType, secretValue)`.
- Configure the admin token by running `setAdminToken("long-random-token")` in Apps
  Script, redeploying, and pasting that token into the `admin.html` sidebar.
- The admin review panel records append-only rows in `Admin Actions`. Protected update
  operations can also set moderation/source connector fields without exposing public
  mutation controls.
- Keep `approvalStatus` as `Pending review` until the organizer/source has been checked.
- Keep `syncStatus` as `Needs secure setup` for OAuth/API requests until credentials are
  approved and stored.
- Imported events should keep `sourcePlatform`, `sourceName`, `sourceUrl`, and
  `importedFromSourceId` populated so the calendar remains transparent.
- RSVPs should point to the original event platform unless the event is natively hosted
  by F&B.

## Manual Import Queue

The manual import queue in `admin.html` is the first production-friendly importer. It is
designed for approved sources before full OAuth/API automation exists.

Accepted paste formats:

- iCal/ICS text containing one or more `VEVENT` blocks.
- JSON arrays or objects with event-like fields such as `title`, `date`, `time`,
  `location`, `description`, `url`, and `id`.
- CSV or TSV with headers such as `title`, `date`, `time`, `city`, `category`,
  `location`, and `rsvpLink`.
- Labeled text blocks such as `Title:`, `Date:`, `Time:`, `Location:`, and `RSVP:`.

Before publishing, admins can edit each parsed event's title, date, time, city, category,
location, RSVP link, source platform, source name, source URL, source event ID,
description, and contact email. Only checked events are posted to the public `Events`
tab. Publishing also writes an `Imported events from source` audit row in `Admin Actions`.

## Duplicate Detection

The importer checks for duplicates before publishing:

- Strong match: same `sourceEventId`, optionally scoped by `sourcePlatform`.
- Fallback match: same normalized title, date, and city.
- Batch match: repeated event fingerprint inside the current preview.

Duplicate candidates are unchecked automatically. If an admin rechecks one, publishing is
blocked until it is unchecked or edited into a genuinely different event.

## Expiration Cleanup

The cleanup panel in `admin.html` finds visible events older than the selected age window
and archives selected rows through the protected `adminOperation: "updateRecord"` path.
Archived rows stay in the Sheet for auditability, but `calendar.js` and the platform
public filters hide records with `moderationStatus=Archived`.

## Provider Connector Notes

The provider connector panel is a readiness layer, not a full OAuth handshake. It records
non-secret identifiers such as provider organization IDs, calendar IDs, endpoints, scopes,
connector state, and notes. Credentials still belong only in Apps Script Properties or a
future secure server-side integration.

Official references to verify before enabling live provider sync:

- Luma API: <https://docs.luma.com/reference/getting-started-with-your-api>
- Meetup GraphQL API: <https://www.meetup.com/graphql/guide/>
- Meetup OAuth: <https://www.meetup.com/graphql/authentication/>
- Eventbrite API basics: <https://www.eventbrite.com/platform/docs/api-basics>
- Eventbrite OAuth: <https://www.eventbrite.com/platform/docs/authentication>
- Eventbrite organization events: <https://www.eventbrite.com/platform/docs/events>

## Public Calendar Fields

Approved external events live in the regular `Events` tab and use these optional
attribution/import columns:

| Field | Purpose |
|---|---|
| `sourcePlatform` | Platform label shown on cards and filters |
| `sourceName` | Organizer/source attribution |
| `sourceUrl` | Public source page |
| `sourceEventId` | Original platform event ID, if available |
| `importStatus` | Review/import status |
| `importedFromSourceId` | Link back to the `Event Sources` row |
| `externalUpdatedAt` | Source-side update timestamp for future sync checks |
