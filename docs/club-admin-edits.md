# Club admin changes: teams, squads, managers and players

The backend for the club admin pages that change data. The frontend still uses its in-memory
stores (`teamStore`, `teamSquadStore`, `teamManagerStore`) and the add-player mock; this lists
what to connect them to.

Code: [`club-admin-edit.service.ts`](../backend/src/club-admin/club-admin-edit.service.ts),
request bodies in [`club-admin.dto.ts`](../backend/src/club-admin/club-admin.dto.ts), tests in
[`club-admin-edit.test.cjs`](../backend/test/club-admin-edit.test.cjs) (I-CLUBEDIT-*).

## Common rules

- Base URL `/api/v1/club-admin`. Like the other club admin routes, the admin is identified by
  `?email=` for the local demo (refused in production), and their club comes from their
  CLUB_ADMIN role, never from the request. Another club's team is a 404.
- Every route answers `{ data }`. IDs in paths and bodies are database UUIDs, not the workbook
  IDs (`TEAM017`, `PLR100`, `SEC02`) the mocks use.
- Every change is one transaction and adds one `AuditLog` row: `entityType` `TEAM` or `PLAYER`,
  the `action` below, a readable `changeSummary` and `changedBy` = the admin's user ID.
- Team changes answer with the team as `GET teams/:teamId` does (`ClubTeamDetail`), so the page
  can show the result without a second request. Player changes answer with `GET players/:playerId`.
- A database failure is a 503 `DATA_UNAVAILABLE`, with no details.

## Create team (`ClubAdminTeamCreatePage`)

| | |
| --- | --- |
| `GET open-sections` | Sections the club can enter: those of **UPCOMING** seasons in competitions the club's association runs, empty ones included. Each has its season and competition (as `GET sections`) and `teamCount`, the teams already entered from any club. Use it to fill the Competition, Season and Section choices instead of the hardcoded ones. |
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
  with `reason: "NO_LOGIN_ACCOUNT"`. The page does not know this yet: its candidates are every
  active club member. The other reasons are `INACTIVE_PLAYER` and `NOT_CLUB_MEMBER`.
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

## What the frontend will need to change

- **Create new player** must collect **date of birth and gender**. Both are required columns,
  but the page currently allows a missing date of birth and has no gender field.
- **Email can't be saved** for a new player. A player's email is on their login account,
  which this flow does not create. The page's "juniors need a parent or guardian email" rule
  also has nowhere to be stored yet. That needs a decision before it can be built.
- **Assign manager** should explain or hide players without a login account (see above).
- **Create team** should take its choices from `GET open-sections`. The section IDs are UUIDs.
