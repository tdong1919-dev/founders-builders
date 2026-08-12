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
8. Admin updates the `Event Sources` row in Sheets and handles any secure setup outside
   the public form.
9. Approved events are added to the public `Events` tab with source attribution fields.

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
  API setup.
- Meetup and Eventbrite: use public organizer/event URLs for curation when enough; use
  OAuth setup for organizer-authorized account/API access.
- Partiful and other websites: start with public URLs and manual review unless an
  official export, feed, or API path is available.
- Google Calendar and iCal: public feed URLs are the cleanest first version.

These platform capabilities can change, so verify the current provider documentation
before building automated importers.

## Admin Rules

- Do not store OAuth tokens, API keys, passwords, or private guest data in Google Sheets.
- Store approved secrets in Apps Script Properties using `setEventSourceSecret` from
  `apps-script/Code.gs`, then update `secretStatus` in the `Event Sources` row.
- The admin review panel records append-only rows in `Admin Actions`. It does not mutate
  source rows because the current public Apps Script endpoint does not have secure
  role-based admin authentication.
- Keep `approvalStatus` as `Pending review` until the organizer/source has been checked.
- Keep `syncStatus` as `Needs secure setup` for OAuth/API requests until credentials are
  approved and stored.
- Imported events should keep `sourcePlatform`, `sourceName`, `sourceUrl`, and
  `importedFromSourceId` populated so the calendar remains transparent.
- RSVPs should point to the original event platform unless the event is natively hosted
  by F&B.

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
