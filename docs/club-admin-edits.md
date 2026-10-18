# Club admin changes: teams, squads, managers and players

The backend for the club admin pages that change data, and how the pages use it. Every change
is saved by these routes; the pages keep no data of their own and show the record as the
backend answers it.

Code: [`club-admin-edit.service.ts`](../backend/src/club-admin/club-admin-edit.service.ts),
request bodies in [`club-admin.dto.ts`](../backend/src/club-admin/club-admin.dto.ts), tests in
[`club-admin-edit.test.cjs`](../backend/test/club-admin-edit.test.cjs) (I-CLUBEDIT-*).

## Common rules

- Base URL `/api/v1/club-admin`. Like the other club admin routes, the admin is identified by
  `?email=` for the local demo (refused in production), and their club comes from their
  CLUB_ADMIN role, never from the request. Another club's team is a 404.
- Every route answers `{ data }`. IDs in paths and bodies are database UUIDs, not the workbook
  IDs (`TEAM017`, `PLR100`, `SEC02`).
- Every change is one transaction and adds one `AuditLog` row: `entityType` `TEAM` or `PLAYER`,
  the `action` below, a readable `changeSummary` and `changedBy` = the admin's user ID.
- Team changes answer with the team as `GET teams/:teamId` does (`ClubTeamDetail`), so the page
  can show the result without a second request. Player changes answer with `GET players/:playerId`.
- A database failure is a 503 `DATA_UNAVAILABLE`, with no details.

## Create team (`ClubAdminTeamCreatePage`)

| | |
| --- | --- |
| `GET open-sections` | Sections the club can enter: those of **UPCOMING** seasons in competitions the club's association runs, empty ones included. Each has its season and competition (as `GET sections`) and `teamCount`, the teams already entered from any club. The page fills its Competition, Season and Section choices from it, and says so when none are open. |
| `POST teams` `{ sectionId, name }` | 201. `name` is trimmed, inner spaces collapsed, at most 80 characters. Action `CREATE`. |

| Error | When |
| --- | --- |
| 404 `SECTION_NOT_FOUND` | The section does not exist or belongs to another association. |
| 409 `SEASON_NOT_OPEN` | The season is ACTIVE, COMPLETED or ARCHIVED. Only UPCOMING seasons take new teams. |
| 409 `TEAM_NAME_TAKEN` | Another team in the **same season** has that name, ignoring case and spaces. This is the database's rule (`team_season_id_name_key`) and is stricter than the page's per-section check. |

## Squad (`ClubAdminTeamAddPlayersPage`, remove on `ClubAdminTeamDetailPage`)

| | |
| --- | --- |
| `POST teams/:teamId/players` `{ playerIds: [...] }` | 200. 1 to 50 IDs; duplicates are ignored. Everyone becomes ACTIVE with `registerAt` now; an INACTIVE (former) or EMERGENCY player's existing row is reused. Action `ADD_PLAYERS`. |
| `DELETE teams/:teamId/players/:playerId` | 200. Sets the row to INACTIVE, keeping the player's history. Only an ACTIVE player can be removed. Action `REMOVE_PLAYER`. |

A player can join when they are an ACTIVE player with a **current** membership of the club
(ACTIVE, started, not ended; dates in Melbourne time) and are not already ACTIVE in the squad.
These are the page's own rules. If anyone fails, nothing is written and the 422 lists everyone:

```json
{ "statusCode": 422, "code": "PLAYERS_NOT_ELIGIBLE", "message": "Some players cannot join this squad",
  "players": [{ "id": "…", "reason": "ALREADY_IN_TEAM" }] }
```

Reasons: `PLAYER_NOT_FOUND` (no such player, a merged profile, or a club admin's own profile),
`INACTIVE_PLAYER`, `NOT_CLUB_MEMBER`, `ALREADY_IN_TEAM`.

Other errors: 404 `PLAYER_NOT_IN_TEAM` (remove), 409 `SEASON_CLOSED` when the team's season is
COMPLETED or ARCHIVED.

## Team manager (`ClubAdminTeamAssignManagerPage`, remove on `ClubAdminTeamDetailPage`)

| | |
| --- | --- |
| `PUT teams/:teamId/manager` `{ playerId }` | 200. Replaces any current manager. Assigning the current manager again changes nothing. Action `ASSIGN_MANAGER`. |
| `DELETE teams/:teamId/manager` | 200. Allowed after the season too, so the manager is free to take a new team. Action `REMOVE_MANAGER`. |

A manager is a `UserRole` (TEAM_MANAGER, context TEAM, with `clubId` and `teamId`), and a user has
exactly one role row. So:

- The player needs a **login account**. A player without one gets 422 `MANAGER_NOT_ELIGIBLE`
  with `reason: "NO_LOGIN_ACCOUNT"`. The other reasons are `INACTIVE_PLAYER` and `NOT_CLUB_MEMBER`.
  The page knows all of this before anyone is picked, from `GET players` (below).
- Their role becomes TEAM_MANAGER. A replaced or removed manager goes back to PLAYER (context
  GLOBAL) instead of being revoked, so they can still sign in as a player.
- 409 `MANAGES_ANOTHER_TEAM`: they already manage a team whose season is still UPCOMING or
  ACTIVE. Managing a finished season's team does not block them.
- 409 `HOLDS_ANOTHER_ROLE`: they hold another role, e.g. club admin or association administrator.
- 409 `SEASON_CLOSED` for a finished season's team (assign only), 404 `NO_MANAGER` (remove).

## Add a player (`ClubAdminAddPlayerPage`)

| | |
| --- | --- |
| `GET registry/players?name=&dateOfBirth=&playerEmail=` | Step 1, Search. `name` is required; `dateOfBirth` is `YYYY-MM-DD`; `playerEmail` is the person being searched for (the admin's own `email` is taken). Returns up to 20 `RegistryMatch`, best first. |
| `POST players/:playerId/membership` | Step 2, "Add to my club". 201. Action `JOIN_CLUB`. |
| `POST players` `{ firstName, lastName, dateOfBirth, gender }` | Step 2, "Create new player". 201. Action `CREATE`. |

**Search.** Whether someone is a candidate depends only on the name, using the scoresheet
matching rules ([player-matching.md](player-matching.md)): short forms (Ben for Benjamin), nicknames, initials,
and one word as either a first name or a surname. Date of birth and email only rank the results
(exact name 100, +30 each if they agree), so a typo there never hides the right person. Results
carry `match.name` (`exact` / `similar`) and `match.nameReasons`; `match.dateOfBirth` and
`match.email` are `true`, `false`, or `null` if not given. They also carry `inThisClub` and
`otherClubs` (names of other clubs with a current membership). Results never include date of
birth, email or phone. Merged profiles and club admins are left out.

**Add to my club.** Starts a membership today. A former member's INACTIVE row is restarted (new
start date, end date cleared). It is their primary club only if they have no other current
primary club. 409 `ALREADY_MEMBER`; 404 `PLAYER_NOT_FOUND` for unknown, merged or club-admin
profiles.

**Create new player.** Creates the player and an ACTIVE, primary membership of the club from
today. `isJunior` is set when they are under 18 today. 409 `POSSIBLE_DUPLICATE` with `playerId`
when a profile with the same name (ignoring case) and date of birth exists; offer to add that
one instead.

## What the pages read

The edit pages read these routes too, through `frontend/api/club-admin-players.ts` and
`club-admin-teams.ts`. Tests: I-CLUBADMIN-011 to -017 in
[`club-admin.test.cjs`](../backend/test/club-admin.test.cjs).

| Route | Fields the pages rely on |
| --- | --- |
| `GET players` | One row per member, active or not. `status` is the player record's own status; `membership` is this club's. For the Assign manager page: `hasLogin` (a login account exists), `role` (the account's one unrevoked role, or null) and `managedTeam` (`{ id, name }` of the team they manage in a season still to finish, else null). |
| `GET teams` | Every season's teams with `squadCount` (ACTIVE places) and `managerName` (or the manager's email without a profile), for the Teams page and its season tabs. |
| `GET teams/:teamId` | The team with its roster, `managerName` (profile name or null) and `manager`: `{ playerId, name, email }` or null. `playerId` is null and `name` is the email when the manager has no profile. The page marks the manager in the squad by `playerId`. |

## How the pages use them

- **Add a player** searches with `GET registry/players`, then "Add to my club" or "Create new
  player". A refusal shows the backend's reason; `POSSIBLE_DUPLICATE` names the existing record.
- **Create new player** collects date of birth and gender, both required. **Email can't be
  saved** for a new player: it is on their login account, which this flow does not create. The
  "juniors need a parent or guardian email" rule also has nowhere to be stored yet. That needs a
  decision before it can be built.
- **Squad**: "Add players" offers the club's members, with those who can't join greyed out and
  why; a 422 names each player the backend refused and why. "Remove" on the team page saves at once.
- **Assign manager** greys out, with the reason, players with no login account, another role, or
  a team still playing. "Remove manager" on the team page saves at once.
- **Create team** takes its choices from `GET open-sections` and suggests the club's name with
  the next free letter ("Glen Waverley C"). The backend refuses a name used in the season by any club.
- A finished season's squad and manager can't change (409 `SEASON_CLOSED`). The team page still
  offers the buttons and shows that reason when one is used (an open decision, see
  [hardcoded-values.md](hardcoded-values.md) §4).
- **End membership** on a player's page is not saved: there is no route for it yet, because the
  rules for ending a membership wait on client decision A07. The page says so in its confirmation.

Tested in the browser against the seeded database by E2E-017 (team, squad and manager, then undone)
and E2E-018 (a new player, then another club adds them from the registry), and against a fake
backend by I-UI-008 to I-UI-011 in `frontend/tests/club-admin-pages.test.tsx`.
