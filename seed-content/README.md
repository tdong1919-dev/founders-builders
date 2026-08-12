# Founders & Builders seed-content policy

Seed content should make the platform useful without pretending that fake people,
companies, investors, funds, jobs, events, or testimonials are real.

## Allowed

- Opt-in records from real people or organizations.
- Public resources with a source URL and attribution.
- Public events with a source URL and current date.
- Clearly labeled demo/template rows for testing layout only.
- Draft rows marked `Needs review` before publication.

## Not allowed

- Invented member profiles.
- Invented investor or fund profiles.
- Fake funding rounds, jobs, testimonials, events, or companies.
- Real people copied from another platform without permission or a public source.
- Any funding record that implies endorsement, recommendation, or diligence by F&B.

## Intake workflow

1. Add candidate rows to `templates/seed-intake.csv` or to a private review Sheet.
2. Fill in `sourceUrl`, `permissionStatus`, and `moderationStatus`.
3. Keep `moderationStatus` as `Needs review` until a human approves the row.
4. Move approved rows into the matching hub tab using the schema in
   `apps-script/SCHEMA.md`.
5. For funding and investor records, confirm the disclaimer language is visible and
   avoid claims that F&B has verified investment suitability.

## Suggested launch targets

- 50 opt-in member profiles.
- 25 verified business listings.
- 25 opt-in mentors.
- 30 useful public resources.
- 20 current events.
- 20 real jobs or collaboration opportunities.
- 20 real help requests from members.
- 10 opt-in investor profiles, all reviewed carefully.

