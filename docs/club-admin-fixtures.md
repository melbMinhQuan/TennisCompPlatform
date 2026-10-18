# Club Admin Fixtures & Results

Routes: `/club-admin/fixtures`, `?view=results`, and `/club-admin/fixtures/:fixtureId`.

View-only page (components in `frontend/components/club-admin/fixtures/`) using the shared Player/Club Admin colours, cards, buttons and responsive shell. `api/club-admin-fixtures.ts` loads the two routes below as the signed-in administrator: the list for the Fixtures and Results tabs, and one fixture for the detail page. Route IDs are database UUIDs. A failed request shows an error and a retry button; there is no sample data.

Glen Waverley's seeded data has 72 fixtures: 28 Weekend Senior Winter 2026, 14 Weekend Senior Winter 2025, 14 Weekend Senior Summer 2025/26 and 16 Night Tennis Autumn 2026, 67 of them with a result (E2E-014 opens the newest). The fixture view includes SCHEDULED rows with past dates and one POSTPONED row with no date/time. Results come from MatchResult and include status, rubber players and home–away set scores. Missing values display unavailable/TBC rather than zero. Dates are date-only and clock times are local to the venue.

Filters support competition/season, own-club team and text search, with eight rows per page. Opponent teams are visible in matches but not selectable as the administrator's club teams: a team is the club's when its `clubId` is the fixture's `clubId`. The detail page shows "Fixture not found" when the backend answers 404 (another club's or an unknown fixture) or 400 (not an ID). There are no result entry, correction, dispute or scheduling actions: those are outside Club Administrator Sprint 2 scope under User Stories v2.1. The page links to Help for escalation.

## Backend API

Built in [`club-admin-fixture.service.ts`](../backend/src/club-admin/club-admin-fixture.service.ts),
tests in [`club-admin-fixture.test.cjs`](../backend/test/club-admin-fixture.test.cjs) (I-CLUBFIX-*).
The frontend uses both.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/v1/club-admin/fixtures` | `{ data: ClubAdminFixture[] }`: every fixture where the home **or** away team is one of the club's teams, all seasons and statuses, soonest first with undated fixtures last. Not paged. |
| GET | `/api/v1/club-admin/fixtures/:fixtureId` | `{ data: ClubAdminFixture }`, the same shape. A fixture the club does not play in is 404 `FIXTURE_NOT_FOUND`, the same as an unknown one; a non-UUID ID is 400. |

The club comes from the admin's CLUB_ADMIN role (`?email=` for the local demo; otherwise 403
`NOT_CLUB_ADMIN`). Fixtures belong to teams, so they are chosen by team, not through the club's
players. A database failure is a 503 `DATA_UNAVAILABLE`.

The shape matches `ClubAdminFixture` in `api/club-admin-fixtures.ts`, with these details:

- IDs are database UUIDs, not the workbook codes (`FIX0001`, `TEAM001`, `SEA01`). `clubId` is
  the club's UUID, which `isClubFixture` and `clubTeamsOf` compare each side's `clubId` with.
- `round` is "Round 13", the finals label ("Grand Final"), or "Round to be confirmed".
- `changed` is true when the fixture has any `FixtureScheduleChange` row.
- `result` is null until a result is submitted: a DRAFT `MatchResult` is not shown. Rubbers are
  in rubber order, with players by `playerOrder` and sets home first. A rubber's `outcome` is
  null when it is not recorded; it can also be `RETIRED` or `ABANDONED`.

No schema changes are required for the shown fields: Fixture joins Team, SectionGrade, Season, Competition, Venue, FixtureScheduleChange and MatchResult → Rubber/RubberPlayer/RubberSet. Current seed has no dated future fixtures for Glen Waverley. Rounds 13 and 14 (26 Sep to 3 Oct 2026) are still SCHEDULED in the past, the postponed Round 12 fixture has no new date, and there are no later rounds or finals although Winter 2026 runs until 24 Oct. The page labels past SCHEDULED fixtures without a result as “Result not entered”. Re-date or complete these rows and add the remaining rounds so the Fixtures tab can show upcoming matches. Tiebreak-point detail can be added to the view model later if required; this page shows set game scores only.
