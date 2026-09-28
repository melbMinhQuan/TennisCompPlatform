# Hardcoded values in the frontend

Where the frontend still uses fixed values instead of backend data, and why. Use it to find
them quickly. Updated 28 September 2026.

**Short version:** a logged-in player sees only backend data. What remains hardcoded is
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
| Standings & Rankings | [`standings.ts`](../frontend/api/standings.ts) | `GET /api/v1/player/standings` |
| Help & Support → "Who should I contact?" | [`support-contacts.ts`](../frontend/api/support-contacts.ts) | `GET /api/v1/player/support-contacts` |

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
| "UTR Best Rank" always "Not available" | [`CareerSummary.tsx:49`](../frontend/components/profile/CareerSummary.tsx#L49); backend sends `bestUtrRank: null` | `ranking_entry` (rank and percentile per cohort) | The contract in `dashboardapi.md` wants a percentile *and* its cohort ("Top 12% · Waverley Tennis adult singles"). The box shows one number, which would read as a global rank. |
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

**b. What should "Player ID" show?** It shows the database UUID
(`55b918f7-2679-…`), because the workbook codes such as `PLR005` are not stored in the
database. The seed derives UUIDs from them. Options: keep the UUID, hide the row, or add a
readable member number to `Player`.
It appears in [`PlayerProfile.tsx:44`](../frontend/components/PlayerProfile.tsx#L44) and
[`CompetitionEntryCard.tsx:21`](../frontend/components/competitions/CompetitionEntryCard.tsx#L21).

**c. "UTR Best Rank".** Needs a layout change (see 2c). The notifications list is now built:
the card shows the four newest and View All loads the rest. Marking notifications as read is not
built yet; it waits for real sessions (see f).

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
`DemoEmailGuard` refuses when `NODE_ENV=production`.
