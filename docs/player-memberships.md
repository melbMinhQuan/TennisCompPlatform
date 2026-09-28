# My Clubs, Associations & Teams

## Current frontend
Route: /dashboard/clubs. The page uses a fictional sample player by default, independently of login or the dashboard API. The desktop header uses the same sample name on this route.

The desktop/mobile layout follows the supplied design: identity and counts, association sections, club cards, badges, and team chips. View Teams expands all the player's teams for that club with competition, season and section details. Counts use distinct entity IDs. The first two teams appear as chips; additional teams have a “+N more” indicator.

## Sample data and Excel relationships
frontend/data/mock-memberships.ts is hardcoded with Chloe Cooper's (PLR005) rows copied from Project detail/competition_data.xlsx, keeping the workbook IDs (AM006, CM002, CLB01, TEAM018...). After the API is connected, logging in as chloe.cooper005@players.example should show exactly the same page, which is the quickest integration check. She covers two associations, a primary and three additional clubs, a club with no team (Forest Hill), and current and past-season teams in two competitions. The rows follow the workbook relationships:
- Player → AssociationMembership → Association
- Player → ClubMembership → Club → Association
- Player → TeamPlayer → Team → SectionGrade → Season → Competition

The fixture joins these records into the page's response model. Database IDs, membership IDs and relationship IDs remain distinct. The frontend uses camelCase; workbook columns use snake_case.

AssociationMembership in the workbook has no start_date, so its sample date is null and “Member since” is omitted. Club membership dates are available. A club's association does not imply an explicit player association membership. Clubs without a corresponding association membership appear under “Other club memberships”.

## API handoff
frontend/api/memberships.ts owns the PlayerMemberships contract and getPlayerMemberships(signal). The React page consumes only this contract.

Logged in, it calls GET /api/v1/player/memberships?email=, which returns { data: PlayerMemberships }: every association and club membership (all statuses) and the teams the player is ACTIVE on. The email is the local demo identity used by the dashboard, not an authenticated session; replace it when real sessions exist.

Logged out, the service returns a cloned sample response. API failures show an error and Retry; they never silently fall back to sample data.

Expected data:
- player: { id, displayName }
- associations[]: { id (membership ID), associationId, name, isPrimary, status, startDate, endDate } (AssociationMembership has no dates in the workbook, so both are null)
- clubs[]: { id (membership ID), clubId, associationId, associationName, name, isPrimary, status, startDate, endDate } (ClubMembership.start_date / end_date)
- teams[]: { id (team ID), clubId, name, competitionName, seasonLabel, seasonStatus, sectionName }
  - seasonLabel is Season.season_type + year, e.g. "Winter 2026"
  - seasonStatus is Season.status (ACTIVE / COMPLETED / ARCHIVED); the page lists ACTIVE (current) teams first and labels the rest "Past season"

A membership with an endDate shows "Ended {Month Year}" instead of "Active membership".

Membership status is ACTIVE or INACTIVE. Dates are ISO dates or null. Arrays are complete for the agreed membership scope, not paginated fragments. Return only this player's team assignments, with clubId matching a returned club membership; resolve inconsistent relationships before supplying the page. Counts reflect the returned memberships, including inactive records if supplied. Agree active/history filtering with the backend. No membership is inferred from club ownership.

The endpoint name and final backend DTO are not assumed. The existing dashboard endpoint does not yet provide this entire contract. No backend/schema or database changes are included.


## Team member details
Expand View Teams, then click a team entry or its “View team members” link.
Route: /dashboard/clubs/teams/:teamId. Direct URLs also load the team.
The page shows club/association, competition, season, section, and the roster's
names sorted A–Z. The logged-in player is highlighted with a "You" tag. Only
unusual TeamPlayer statuses (Emergency, Inactive) get a badge; Active is the default.
Past seasons remain labelled; a player's ACTIVE roster status is independent of
whether the season has finished. A back link returns to My Clubs.

frontend/data/mock-team-members.ts contains the six Player/TeamPlayer joins for
each of TEAM001, TEAM018 and TEAM035 from competition_data.xlsx. No contact
details, birthdays, or invented captain roles are included.

frontend/api/teams.ts is the API adapter. Logged in, it calls
GET /api/v1/player/teams/:teamId?email=, which answers only for a team the
player is on (any other team is 404). The envelope is { data: TeamDetails }; TeamDetails extends MembershipTeam with clubName,
associationName, and members: { id (player ID), name, status
(ACTIVE/EMERGENCY/INACTIVE), isCurrentPlayer (true only for the logged-in
player, which the server knows from the session) }[].
The server must authorize roster access. Map a different backend response here.

Mock rosters are used only when nobody is logged in. Live failures never fall back to mock rosters. HTTP 404
shows not found, other failures allow retry, and an empty roster has its own
message. Pending requests are aborted on navigation or identity changes.

**Logged-in players never see sample data.** Sample data (Chloe Cooper) is only a logged-out preview. A logged-in player always gets their own data from the backend; if that request fails the page shows an error and "Try again", never the sample.
