# Club Admin dashboard — display-only Sprint 2 implementation

Route: `/club-admin`. `ClubAdminDashboardPage.tsx` loads the sample through `api/club-admin-dashboard.ts` (same adapter pattern as the player pages) and renders `components/club-admin/ClubAdminDashboardContent.tsx` with the Sprint 1 page, card and button styles. No writes or live API calls are made. Quick actions open the existing Players and Teams routes, which remain placeholders.

Reference: [Figma dashboard](https://www.figma.com/design/A2NqehyeuwSK4AH0EOTRQh?node-id=1-191), [Sprint 2 plan](https://itprojectvibecoding.atlassian.net/wiki/pages/17170500), [User Stories v2.1](https://itprojectvibecoding.atlassian.net/wiki/pages/17793533), [client Sprint 1 feedback](https://itprojectvibecoding.atlassian.net/wiki/pages/12222465).

## What the current schema supports

The hardcoded JSON is a snapshot of `backend/prisma/competition_data.xlsx` inspected on 10 October 2026, not a query of the running database. Schema support does not prove that migrations or these rows have been applied to a local/deployed database.

| Display | Existing source / later API calculation |
| --- | --- |
| Club name, ID, association and official contacts | `Club` → `Association`; club context from the authenticated, unrevoked `UserRole` |
| Administrator name | `UserRole.userId` → `User.player` |
| Active member count | Distinct players with `ClubMembership.clubId`, ACTIVE status and valid start/end dates; club-wide, independent of season |
| Competition and season selector | `Team.section` → `SectionGrade.season` → `Season.competition` |
| Team count and squad size | Club-scoped `Team` rows for selected season; ACTIVE `TeamPlayer` rows |
| Manager name / missing manager | Unrevoked TEAM_MANAGER `UserRole.teamId` → `User.player`; an assigned user without a player record still counts as assigned, using the account email as fallback |
| Teams needing attention | Distinct active-season teams without a manager OR with no active squad; not a stored counter, not proof of competition eligibility |
| Unread notices | Recipient's IN_APP `Notification` rows with null `readAt`, filtered to authorised club context; EMAIL rows never count |
| Recent result activity | `AuditLog` → own-club `MatchResult` → `Fixture` → home/away `Team`; most recent across seasons |
| Fixtures, venue and results | `Fixture`, `Venue`, `MatchResult`; available schema, but no scheduled fixture on/after the sample date for this club in this workbook |

The sample shows 26 active club memberships, two Winter 2026 teams, six active squad players in each, assigned managers and zero current setup tasks. One recipient notice targets a fixture involving Glen Waverley; two other notices for Ethan's player participation at another club are excluded. Historical teams do not create current setup tasks. Counts and selected team rows share one data source, as does the sidebar unread badge. There is no separate notices card: the unread count is shown in the summary card and the sidebar, which link to Notifications (US-22 is a Should).

The Figma numbers (128 members, eight teams, two tasks, three notices), CL-004 identifier and “Summer 2026/27 entries are open” are illustrative. This implementation uses the workbook's CLB01 identifier and actual sample counts instead. The team selector demonstrates current and past seasons. The sample's Summer 2025 label reflects `seasonType` + `year`; a cross-year season label should later be formatted from its dates or a deliberate display label.

## Database changes / additions to discuss

No database migration is required for the summary, team rows, manager checks or basic fixture/result display. Do not add stored dashboard counters.

1. **Team entry window (only if “entries are open” is required):** `Season` has play dates/status but no registration opening/closing dates. Add optional entry-window dates to Season (or a dedicated policy) after deciding scope and timezone. ACTIVE does not mean registrations are open.
2. **Out-of-date Winter 2026 fixtures (checked 10 Oct 2026):** the workbook was generated around 22 Sep. Rounds 13–14 (16 fixtures, 26 Sep–3 Oct) are still SCHEDULED in the past, there are no fixtures after 3 Oct and no finals, although Winter 2026 is ACTIVE until 24 Oct. Re-date or complete these rows so fixtures and results show correctly.
3. **Summer 2026/27 demonstration data:** add the planned season, its sections and example incomplete teams to the workbook/seed. These are seed rows, not new tables. Do not turn existing historical teams into current examples.
4. **Administrative activity:** `AuditLog` already stores entity, action, actor, timestamp and summary. Start writing membership, squad and manager events in the mutation endpoints. An explicit `clubId` with an index would make secure club-scoped activity queries easier, particularly after role revocation or deletion. It is not needed for the existing result events that can be joined through a fixture.
5. **Club-targeted notifications:** current notifications are per user, with no explicit club context. Fixture-targeted rows can be authorised via home/away clubs. If US-22 includes general club alerts, consider adding nullable `clubId` (relation/index), or an explicit recipient-context model, and route delivery to involved clubs' administrators. Do not expose all of a user's player notifications in the club dashboard.
6. **Team name validation (US-20):** `Team` lacks a unique constraint on section + name. Decide case/whitespace normalisation, then add a corresponding uniqueness rule/constraint to prevent duplicate names within a section.

Membership end status is INACTIVE plus `endDate`, shown as “Inactive” on screen. A new enum is not required. Primary-club transfer rules and effects of ending membership on current squads still require the client decision recorded as A07.

## API connection later

A proposed read endpoint is `GET /api/v1/clubs/:clubId/dashboard?seasonId=...`. Derive club access from the authenticated role, reject other clubs (US-18), validate the selected season against the club's data and return a typed view matching the display snapshot. Do not accept client-provided actor/user IDs as authority. Include member counts, seasonal teams and attention, scoped notices and activity; use explicit empty/null values for unavailable information. A failed live request must show an error/retry state, never silently fall back to sample values.

Registry search before creation (US-19), active eligible squad assignment (US-21) and team manager access (US-45) remain the priority workflow. Club administrators do not correct confirmed scores or resolve disputes; those are association responsibilities under v2.1. Junior DOB/contact details are deliberately absent from the dashboard.
