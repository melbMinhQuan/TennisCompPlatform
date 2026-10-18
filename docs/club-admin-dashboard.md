# Club Admin dashboard

Route: `/club-admin`. `ClubAdminDashboardPage.tsx` loads `GET /api/v1/club-admin/dashboard` through `api/club-admin-dashboard.ts` as the signed-in administrator (same adapter pattern as the player pages) and renders `components/club-admin/ClubAdminDashboardContent.tsx` with the Sprint 1 page, card and button styles. A failed request shows an error and a retry button; there is no sample data to fall back to. Quick actions open the Players and Teams pages.

Reference: [Figma dashboard](https://www.figma.com/design/A2NqehyeuwSK4AH0EOTRQh?node-id=1-191), [Sprint 2 plan](https://itprojectvibecoding.atlassian.net/wiki/pages/17170500), [User Stories v2.1](https://itprojectvibecoding.atlassian.net/wiki/pages/17793533), [client Sprint 1 feedback](https://itprojectvibecoding.atlassian.net/wiki/pages/12222465).

## What the current schema supports

Every value below is read from the running database by the backend when the page opens.

| Display | Existing source / later API calculation |
| --- | --- |
| Club name, ID, association and official contacts | `Club` → `Association`; club context from the authenticated, unrevoked `UserRole` |
| Administrator name | `UserRole.userId` → `User.profile` |
| Active member count | Distinct players with `ClubMembership.clubId`, ACTIVE status and valid start/end dates; club-wide, independent of season |
| Competition and season selector | `Team.section` → `SectionGrade.season` → `Season.competition` |
| Team count and squad size | Club-scoped `Team` rows for selected season; ACTIVE `TeamPlayer` rows |
| Manager name / missing manager | Unrevoked TEAM_MANAGER `UserRole.teamId` → `User.profile`; an assigned user without a player record still counts as assigned, using the account email as fallback |
| Teams needing attention | Distinct active-season teams without a manager OR with no active squad; not a stored counter, not proof of competition eligibility |
| Unread notices | Recipient's IN_APP `Notification` rows with null `readAt`, filtered to authorised club context; EMAIL rows never count |
| Recent result activity | `AuditLog` → own-club `MatchResult` → `Fixture` → home/away `Team`; most recent across seasons |
| Fixtures, venue and results | `Fixture`, `Venue`, `MatchResult`; available schema, but no scheduled fixture after 3 Oct 2026 for this club in this workbook |

The seeded database shows Glen Waverley with 26 active club memberships, two Winter 2026 teams, six active squad players in each, assigned managers and zero current setup tasks (checked by E2E-011). The unread tile, the sidebar badge and the Notifications page count the same list, loaded once per visit by `context/ClubAdminNotifications.tsx` (see `club-admin-notifications.md`), so marking a notice read updates all three. Historical teams do not create current setup tasks. Counts and selected team rows share one data source, as does the sidebar unread badge. There is no separate notices card: the unread count is shown in the summary card and the sidebar, which link to Notifications (US-22 is a Should).

The Figma numbers (128 members, eight teams, two tasks, three notices), CL-004 identifier and “Summer 2026/27 entries are open” are illustrative. The page shows the real counts, and the club's database ID as its Club ID (an open decision, see [hardcoded-values.md](hardcoded-values.md) §4). The team selector lists every season the club has a team in. The backend labels a season that crosses the new year from its dates ("Summer 2025/26").

## Backend API

`GET /api/v1/club-admin/dashboard` → `{ data: ClubAdminDashboard }`, built in
[`club-admin-dashboard.service.ts`](../backend/src/club-admin/club-admin-dashboard.service.ts),
tests in [`club-admin-dashboard.test.cjs`](../backend/test/club-admin-dashboard.test.cjs) (I-CLUBDASH-*).
The page uses it. As on the other club admin routes, the
club comes from the admin's CLUB_ADMIN role (403 `NOT_CLUB_ADMIN` otherwise), and a database
failure is a 503 `DATA_UNAVAILABLE`.

It is a club-wide view, so it shares no logic with the player dashboard. It follows the table
above, with these choices:

| Field | How it is worked out |
| --- | --- |
| `asOf` | Today in Melbourne; the day the counts are for. |
| `club` | `Club` and its association's name. `id` is the club's UUID. |
| `adminName` | The admin's profile first name ("Welcome, Margaret"), or their account email when they have no profile. Never null. |
| `activeMembers` | Distinct players with a current membership (ACTIVE, started, not ended). Club admins' own profiles are not counted, as on the Players page. |
| `seasons` | Seasons the club has a team in, oldest first. Cross-year seasons are labelled "Summer 2025/26". |
| `teams` | Every club team in every season; the page filters by `seasonId`. `squadCount` counts ACTIVE squad places. `managerName` is the current TEAM_MANAGER's name, or their email without a profile. "Needs attention" is still worked out on the page by `dashboardSeasonSummary`. |
| `unreadCount` | The admin's unread IN_APP notifications, as `GET notifications` counts them. The tile shows it until the shared notification list has loaded. |
| `activity` | **Up to 5** newest `AuditLog` events about the results of fixtures the club plays in: `MatchResult` events, and `CorrectionRequest` reviews traced to their result. `match` is "Round 12 · Forest Hill B vs Glen Waverley B". Team and player changes made through the club admin routes are not listed. |

**Not returned:** `notices` and `fixtures`. The page never reads them: unread notices are counted
in `unreadCount`, and fixtures come from `GET fixtures`.

Checked against a database seeded with `seed:competition`: Glen Waverley shows 26 active members,
Winter 2026 teams with 6 squad players each and managers Diego Brooks and Ethan Campbell, and the
same newest activity items as the workbook (Round 12 · Forest Hill B vs Glen Waverley B first).

## Database changes / additions to discuss

No database migration is required for the summary, team rows, manager checks or basic fixture/result display. Do not add stored dashboard counters.

1. **Team entry window (only if “entries are open” is required):** `Season` has play dates/status but no registration opening/closing dates. Add optional entry-window dates to Season (or a dedicated policy) after deciding scope and timezone. ACTIVE does not mean registrations are open.
2. **Out-of-date Winter 2026 fixtures (checked 10 Oct 2026):** the workbook was generated around 22 Sep. Rounds 13–14 (16 fixtures, 26 Sep–3 Oct) are still SCHEDULED in the past, there are no fixtures after 3 Oct and no finals, although Winter 2026 is ACTIVE until 24 Oct. Re-date or complete these rows so fixtures and results show correctly.
3. **Summer 2026/27 demonstration data:** add the planned season, its sections and example incomplete teams to the workbook/seed. These are seed rows, not new tables. Do not turn existing historical teams into current examples.
4. **Administrative activity:** `AuditLog` already stores entity, action, actor, timestamp and summary. Start writing membership, squad and manager events in the mutation endpoints. An explicit `clubId` with an index would make secure club-scoped activity queries easier, particularly after role revocation or deletion. It is not needed for the existing result events that can be joined through a fixture.
5. **Club-targeted notifications:** current notifications are per user, with no explicit club context. Fixture-targeted rows can be authorised via home/away clubs. If US-22 includes general club alerts, consider adding nullable `clubId` (relation/index), or an explicit recipient-context model, and route delivery to involved clubs' administrators. Do not expose all of a user's player notifications in the club dashboard.
6. **Team name validation (US-20):** `Team` lacks a unique constraint on section + name. Decide case/whitespace normalisation, then add a corresponding uniqueness rule/constraint to prevent duplicate names within a section.

Membership end status is INACTIVE plus `endDate`, shown as “Inactive” on screen. A new enum is not required. Primary-club transfer rules and effects of ending membership on current squads still require the client decision recorded as A07.

## API connection

Connected. The club comes from the administrator's role, never from the request (US-18), and the
page picks the season itself: the one being played, else the next one open for entries, else the
latest. Season names in the picker say Current, Upcoming or Past. A failed request shows an
error and a retry button, never sample values.

Registry search before creation (US-19), active eligible squad assignment (US-21) and team manager access (US-45) remain the priority workflow. Club administrators do not correct confirmed scores or resolve disputes; those are association responsibilities under v2.1. Junior DOB/contact details are deliberately absent from the dashboard.
