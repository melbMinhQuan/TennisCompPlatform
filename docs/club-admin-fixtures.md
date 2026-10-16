# Club Admin Fixtures & Results

Routes: `/club-admin/fixtures`, `?view=results`, and `/club-admin/fixtures/:fixtureId`.

Display-only Sprint 2 page (components in `frontend/components/club-admin/fixtures/`) using the shared Player/Club Admin colours, cards, buttons and responsive shell. The API adapter returns a hardcoded snapshot of the current `competition_data.xlsx` for CLB01; it does not query the running database. Existing workbook fixture codes are used as sample route IDs; live API IDs may be UUIDs.

72 fixtures: 28 Weekend Senior Winter 2026, 14 Weekend Senior Winter 2025, 14 Weekend Senior Summer 2025 and 16 Night Tennis Autumn 2026. The fixture view includes four SCHEDULED rows with past dates and one POSTPONED row with no date/time. Results come from MatchResult and include status, rubber players and home–away set scores. Missing values display unavailable/TBC rather than zero. Dates are date-only and clock times are local to the venue.

Filters support competition/season, own-club team and text search, with eight rows per page. Opponent teams are visible in matches but not selectable as the administrator's club teams. Details reject unknown/out-of-scope fixture IDs. There are no result entry, correction, dispute or scheduling actions: those are outside Club Administrator Sprint 2 scope under User Stories v2.1. The page links to Help for escalation.

## Backend API

Built in [`club-admin-fixture.service.ts`](../backend/src/club-admin/club-admin-fixture.service.ts),
tests in [`club-admin-fixture.test.cjs`](../backend/test/club-admin-fixture.test.cjs) (I-CLUBFIX-*).
The frontend still uses the snapshot; connect it to these.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/v1/club-admin/fixtures` | `{ data: ClubAdminFixture[] }`: every fixture where the home **or** away team is one of the club's teams, all seasons and statuses, soonest first with undated fixtures last. Not paged. |
| GET | `/api/v1/club-admin/fixtures/:fixtureId` | `{ data: ClubAdminFixture }`, the same shape. A fixture the club does not play in is 404 `FIXTURE_NOT_FOUND`, the same as an unknown one; a non-UUID ID is 400. |

The club comes from the admin's CLUB_ADMIN role (`?email=` for the local demo; otherwise 403
`NOT_CLUB_ADMIN`). Fixtures belong to teams, so they are chosen by team, not through the club's
players. A database failure is a 503 `DATA_UNAVAILABLE`.

The shape matches `ClubAdminFixture` in `api/club-admin-fixtures.ts`, with these details:

- IDs are database UUIDs, not the workbook codes (`FIX0001`, `TEAM001`, `SEA01`). `clubId` is
  the club's UUID, so `isClubFixture` and `clubTeamsOf` should compare with it instead of the
  hardcoded `clubAdminClubId`.
- `round` is "Round 13", the finals label ("Grand Final"), or "Round to be confirmed".
- `changed` is true when the fixture has any `FixtureScheduleChange` row.
- `result` is null until a result is submitted: a DRAFT `MatchResult` is not shown. Rubbers are
  in rubber order, with players by `playerOrder` and sets home first. A rubber's `outcome` is
  null when it is not recorded; it can also be `RETIRED` or `ABANDONED`, which the frontend
  comment does not list.

No schema changes are required for the shown fields: Fixture joins Team, SectionGrade, Season, Competition, Venue, FixtureScheduleChange and MatchResult → Rubber/RubberPlayer/RubberSet. Current seed has no dated future fixtures for Glen Waverley. Rounds 13 and 14 (26 Sep to 3 Oct 2026) are still SCHEDULED in the past, the postponed Round 12 fixture has no new date, and there are no later rounds or finals although Winter 2026 runs until 24 Oct. The page labels past SCHEDULED fixtures without a result as “Result not entered”. Re-date or complete these rows and add the remaining rounds so the Fixtures tab can show upcoming matches. The local workbook on this branch does not yet include Summer 2026/27 (SEA05) from `develop`. Tiebreak-point detail can be added to the view model later if required; this page shows set game scores only.
