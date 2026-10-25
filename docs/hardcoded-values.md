# Hardcoded values in the frontend

Where the frontend still uses fixed values instead of backend data, and why. Use it to find
them quickly. Updated 18 October 2026.

**Short version:** a logged-in player or club administrator sees only backend data. What remains hardcoded is
(1) the sample preview shown when nobody is logged in, (2) static help content and links, and
(3) three values the current layout has no place to show. Section 4 lists the decisions still
open.

## 1. Now served by the backend

Every page below used to show sample data or "not available yet". It now calls the backend
with the logged-in player's email. The adapter in `frontend/api/` picks the path, and
[`client.ts`](../frontend/api/client.ts) makes the request.

| Page / component | Adapter | Endpoint |
| --- | --- | --- |
| Profile card, UTR rating, career summary, Notifications card | [`dashboard.ts`](../frontend/api/dashboard.ts) | `GET /api/v1/player-dashboard` |
| Notifications → View All | [`dashboard.ts`](../frontend/api/dashboard.ts) `getNotifications` | `GET /api/v1/player-dashboard/notifications` |
| Recent Activity, Matches → History, Scorecard | [`matches.ts`](../frontend/api/matches.ts) `getResults` | `GET /api/v1/player/results` |
| Upcoming fixtures, Matches → Upcoming, Fixture details | [`matches.ts`](../frontend/api/matches.ts) `getFixtures` | `GET /api/v1/player/fixtures` |
| My Competitions, Competition details | [`matches.ts`](../frontend/api/matches.ts) `getCompetitions` | `GET /api/v1/player/competitions` |
| My Clubs & Associations & Teams | [`memberships.ts`](../frontend/api/memberships.ts) | `GET /api/v1/player/memberships` |
| Team Details | [`teams.ts`](../frontend/api/teams.ts) | `GET /api/v1/player/teams/:teamId` |
| Standings | [`standings.ts`](../frontend/api/standings.ts) | `GET /api/v1/player/standings` |
| Help & Support → "Who should I contact?" | [`support-contacts.ts`](../frontend/api/support-contacts.ts) | `GET /api/v1/player/support-contacts` |

The club administrator pages have no sample data and no logged-out preview: they open only for a
signed-in club administrator, and call `/api/v1/club-admin/*` with the email kept with their
signed-in role. Their adapters are below; the routes are described in the `club-admin-*.md` docs.

| Club admin page / component | Adapter | Endpoints (under `/api/v1/club-admin`) |
| --- | --- | --- |
| Dashboard | [`club-admin-dashboard.ts`](../frontend/api/club-admin-dashboard.ts) | `GET dashboard` |
| Players, a player's page, Add a player | [`club-admin-players.ts`](../frontend/api/club-admin-players.ts) | `GET players`, `players/:id`, `registry/players`; `POST players`, `players/:id/membership` |
| Teams, a team's page, Create team, Add players, Assign manager | [`club-admin-teams.ts`](../frontend/api/club-admin-teams.ts) | `GET teams`, `teams/:id`, `open-sections`; `POST teams`, `teams/:id/players`; `DELETE teams/:id/players/:playerId`; `PUT` and `DELETE teams/:id/manager` |
| Fixtures & Results, a fixture's page | [`club-admin-fixtures.ts`](../frontend/api/club-admin-fixtures.ts) | `GET fixtures`, `fixtures/:id` |
| Notifications, the sidebar badge, the dashboard's unread tile | [`club-admin-notifications.ts`](../frontend/api/club-admin-notifications.ts) | `GET notifications`; `PATCH notifications/:id/read`, `notifications/read-all` |
| Help & Support → "Who should I contact?" | [`club-admin-support.ts`](../frontend/api/club-admin-support.ts) | `GET support-contacts` |

Values that were `null` before and are now filled in:

- **Win %:** was always "—". It now comes from each rubber's winner.
- **Titles:** was always "—". It now counts section and competition wins, not runners-up.
- **Clubs** on the profile card: was the primary club only. It now lists every active club.

## 2. Still hardcoded

### 2a. Logged-out sample preview (Chloe Cooper)

Used only when nobody is logged in. A logged-in player never sees these values: each adapter
returns the sample only on its `if (!identity)` branch.

| Values | File | Used at |
| --- | --- | --- |
| Profile, UTR 5.35, career summary | [`data/mock-profile.ts`](../frontend/data/mock-profile.ts) | [`DashboardPage.tsx:53`](../frontend/pages/DashboardPage.tsx#L53), [`:61`](../frontend/pages/DashboardPage.tsx#L61), [`:71`](../frontend/pages/DashboardPage.tsx#L71) |
| Header name "Chloe Cooper" | inline | [`PlayerLayout.tsx:18`](../frontend/components/PlayerLayout.tsx#L18) |
| Competitions | [`data/mock-competitions.ts`](../frontend/data/mock-competitions.ts) | [`api/matches.ts:56`](../frontend/api/matches.ts#L56) |
| Fixtures and results | [`data/mock-fixtures.ts`](../frontend/data/mock-fixtures.ts) | [`api/matches.ts:56`](../frontend/api/matches.ts#L56) |
| Memberships | [`data/mock-memberships.ts`](../frontend/data/mock-memberships.ts) | [`api/memberships.ts:38`](../frontend/api/memberships.ts#L38) |
| Team rosters | [`data/mock-team-members.ts`](../frontend/data/mock-team-members.ts) | [`api/teams.ts:25`](../frontend/api/teams.ts#L25) |
| Ladders, standings, rankings | [`data/competition-standings.json`](../frontend/data/competition-standings.json) | [`api/standings.ts:13`](../frontend/api/standings.ts#L13) |
| Support contacts | [`data/mock-support-contacts.ts`](../frontend/data/mock-support-contacts.ts) | [`api/support-contacts.ts:39`](../frontend/api/support-contacts.ts#L39) |
| Notifications | [`data/mock-notifications.ts`](../frontend/data/mock-notifications.ts) | [`DashboardPage.tsx`](../frontend/pages/DashboardPage.tsx) |

They also serve as a regression check. Logging in as `chloe.cooper005@players.example` shows
the same values as the preview, except for IDs (see 4b) and dates that have moved on since the
sample was copied.

`competition-standings.json` also defines the `StandingsData` type, so keep it even if the
preview goes.

### 2b. Static content (not player data)

These values are hardcoded on purpose. They are the same for every player, and no database
table holds them.

| Values | File |
| --- | --- |
| Help topics, FAQ answers, UTR guide links | [`data/support-content.ts`](../frontend/data/support-content.ts) (`HELP_TOPICS`, `UTR_RESOURCES`, `HELP_FAQS`) |
| UTR FAQ buttons on the profile | [`PlayerRatings.tsx:1`](../frontend/components/PlayerRatings.tsx#L1) (`ratingResources`) |
| Menu entries | [`PlayerNavigation.tsx:3`](../frontend/components/layout/PlayerNavigation.tsx#L3) (`MENU_ITEMS`) |
| Competition quick links | [`CompetitionQuickLinks.tsx:7`](../frontend/components/competitions/CompetitionQuickLinks.tsx#L7) (`QUICK_LINKS`) |
| Allowed player statuses | [`DashboardPage.tsx:15`](../frontend/pages/DashboardPage.tsx#L15) (`KNOWN_STATUSES`, mirrors the `PlayerStatus` enum) |
| "REGISTERED" badge | [`CompetitionEntryCard.tsx:11`](../frontend/components/competitions/CompetitionEntryCard.tsx#L11) |

### 2c. Hardcoded because the layout has no place for the data

The data exists in the database, but showing it would need new elements, and the current
layout is fixed.

| What | Where | Data available | What it would take |
| --- | --- | --- | --- |
| "Melbourne time" labels | [`MatchFixturePage.tsx:60`](../frontend/pages/MatchFixturePage.tsx#L60), [`MatchesPage.tsx:63`](../frontend/pages/MatchesPage.tsx#L63) | `venue.time_zone` | Correct today, because all 13 venues are `Australia/Melbourne`. It would be wrong for a venue in another zone. |

## 3. Display-only changes made while connecting

Only the text inside existing elements changed. No element, tag or class was added or removed.

- **Round label:** finals fixtures have no round number, so `Round {x.round}` would have
  printed "Round " with nothing after it. It now prints the finals label, such as
  "Grand Final", through `formatRound` in
  [`utils/formatters.ts`](../frontend/utils/formatters.ts). It is used in
  `UpcomingFixtureCard`, `NextFixtureCard`, `MatchFixturePage`, `MatchScorecardPage`,
  `RecentMatchRow` and `profile-mappers`.
- **Clubs row** on the profile card: now lists every active club, not only the primary one.

## 4. Open decisions (parked, to revisit)

These have a working default in place. Nothing needs to change until someone decides.

**a. Keep or remove the logged-out preview?** Currently kept, as the existing docs describe.
Removing it means deleting the `data/mock-*` files (except `competition-standings.json`, see
2a) and deciding what `/dashboard` shows to a visitor who isn't logged in: redirect to
`/login`, or an empty state.

**b. Done (20 October 2026): "Player ID" shows the readable code.** The team chose the
workbook code (`PLR005`) over the database UUID. The seed stores it in `player.code` and the
APIs return it as `code` beside `id`. A player or club added any other way, such as through the
Add player page, gets the next free code (`PLR113` after `PLR112`) from a database trigger. Only a
row added before that trigger existed has none, and the page shows its UUID instead (`displayId` in
[`utils/formatters.ts`](../frontend/utils/formatters.ts)).
Links and requests still use the UUID. It appears on the profile card, the competition entry
card and every club administrator page that lists players, and their search boxes match it.

**c. Done: notifications list and "UTR Best Rank".** The notifications card shows the four
newest and View All loads the rest. UTR Best Rank shows the best singles percentile as
"Top 72%" with its group name underneath. Still open: marking notifications as read waits for
real sessions (see f), and there is no doubles best rank on the card.

**d. Past fixtures still listed as upcoming.** Round 13 (Sun 27 Sep) is still `SCHEDULED`
because no result has been entered, so "Upcoming" keeps listing it after the date has passed.
The frontend filters on status only
([`profile-mappers.ts:28`](../frontend/components/profile/profile-mappers.ts#L28),
[`MatchesPage.tsx:18`](../frontend/pages/MatchesPage.tsx#L18)). The competition's *next
fixture* already skips past dates. Decide whether "Upcoming" should too, or whether an overdue
fixture should stay visible so its result gets entered.

**e. Undecidable rubbers show as "D".** The result type only allows W, L or D. A rubber whose
winner cannot be determined (a full tie in sets and games, or a missing score) is sent as "D".
None exist in the current data.

**f. The session is lost on page reload.** The logged-in email lives only in React state
([`context/PlayerSession.tsx`](../frontend/context/PlayerSession.tsx)), so a refresh or a
typed URL logs the player out. This is part of the authentication design, which is not built
yet. The backend identifies players by `?email=`, a local demo lookup that the
`DemoEmailGuard` refuses when `NODE_ENV=production`. A club administrator is different: their
role and email are kept in `sessionStorage`
([`context/RoleSession.tsx`](../frontend/context/RoleSession.tsx)), so a reload keeps them
signed in until they log out or close the tab. Decide whether players should get the same.

Parked on 18 October 2026, while connecting the club administrator pages:

**g. Team ID still shows the database UUID.** Club ID (`CLB01`) and Player ID now show the
readable code (see b). Teams have codes in the workbook (`TEAM003`) but no column for them yet,
so a team's page still shows its UUID. Decide whether to add `team.code` the same way.

**h. "End membership" is not saved.** There is no route for it: what ending a membership does to
the player's squads and primary club waits on client decision A07. The button stays on the
player's page, and its confirmation says no database change is made.

**i. A finished season's team still offers squad and manager changes.** The backend refuses
them (409 `SEASON_CLOSED`, "This team's season has finished") and the page shows that reason.
Hiding or disabling the buttons for COMPLETED and ARCHIVED seasons would need a layout change.

**j. Seeded club administrators have no notifications.** The generator only writes notices for
players, so the Notifications page is empty with real data, and marking notices read is tested
only against a fake backend (I-UI-007). Adding club admin rows to the seed would let the
end-to-end tests cover it (see [club-admin/notifications.md](club-admin/notifications.md)).

**k. A suspended or pending account is told "Incorrect email or password."** Login refuses any
account whose `User.status` is not ACTIVE, with the same answer as a wrong password, and checks
the status only after the password, so a guess never learns an account's status (AUTH-008).
Decide whether someone with the right password should instead be told their account is
suspended or not yet active.

Parked on 21 October 2026, while adding junior privacy ([junior-privacy.md](junior-privacy.md)):

**l. The age check uses the season's first day.** A section's age limit is checked against the
junior's age when the season starts. Some competitions use 1 January or 31 December of the year
instead; confirm with the association. It is one line in `sectionEligibility`
([`junior-privacy.ts`](../backend/src/common/junior-privacy.ts)).

**m. Only the association's ADMINISTRATOR sees every junior's details.** The records secretary
gets a 403 too, although they also check eligibility in practice. Decide whether they should.

**n. Parent contacts cannot be entered in the app.** They come from the workbook only: the Add
player form has no parent or guardian fields, so a junior added by a club administrator has no
contact on record and their team manager is told so. A form and route to record them are needed.

**o. Adding a junior to your club shows you all their details.** Another club sees a junior's name
only, but once an administrator adds them to their own club (which is audited as JOIN_CLUB), the
junior is their member and every detail is visible. Decide whether that should need the parent's or
the home club's agreement first.

**p. A junior's login is shared with their parent.** There is no separate parent account; a parent
with two children uses each child's login. A parent who manages a team has a login of their own.

**q. Team managers see only juniors' parent contacts.** An adult teammate's phone and email stay
hidden from the manager, as before. Decide whether managers should be able to contact adults too.

**r. No junior can be a team manager.** A manager sees every junior's parent contact, so anyone
under 18 is refused, including 16- and 17-year-olds who might captain a junior team. Decide
whether older juniors may, and whether they would then see parent contacts.
