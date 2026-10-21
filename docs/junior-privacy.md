# Junior privacy: who sees what

A **junior** is a player under 18 (`player.is_junior`). Their date of birth, phone and login email
are personal details of a child, so the platform shows them only to the people who need them.
Each junior also has a **parent or guardian** on record (`player.guardian_name`, `guardian_email`,
`guardian_phone`), who is the person to contact about matches.

## The rules

| Who is looking | What they see of a junior | Where |
| --- | --- | --- |
| The junior, or their parent on the junior's login | All of the junior's own details, including their parent contact | Profile (player dashboard) |
| The manager of a team the junior is on | The junior's name, a Junior badge, and the parent's name, phone and email. Not the junior's own phone, email or date of birth | Team Details, opened from **Teams you manage** on My Clubs |
| An administrator of the junior's club | Every detail: date of birth, email, phone, parent contact | Club admin → Players → the player's page |
| An administrator of another club | The name only. When they search the registry to add a player, a tick or cross says whether the date of birth and email they typed match. The real values, and which clubs the junior plays for, are never sent | Club admin → Players → Add a player |
| The association's administrator (`ADMINISTRATOR` role) | Every detail of every junior in the association or its clubs, with their age and whether it fits each section's age limit | Association admin → Juniors (where they land after logging in) |
| Other players | The junior's name on a team list they share. No badge, no details | Team Details |

Anyone else gets a 404 for a junior's record or team (it is not revealed that they exist) or a 403
for a page their role cannot open.

**A junior cannot be made a team manager** (422 `MANAGER_NOT_ELIGIBLE`, reason `UNDER_18`), because
a manager sees every junior's parent contact. The Assign manager page greys them out as "Under 18".

## How it is enforced

The backend decides what is sent; the pages only show what arrives. Hiding fields in the frontend
would still send them to the browser, so every rule is applied in the API:

- `backend/src/common/junior-privacy.ts` holds the shared rules: `guardianContact` (a parent
  contact is only ever a junior's) and `sectionEligibility` (the age check).
- **Player routes** (`/api/v1/player/teams/:teamId`): a teammate gets `{ id, name, status,
  isCurrentPlayer }` per member and nothing else. Only the team's current manager (an unrevoked
  `TEAM_MANAGER` role for that team) also gets `isJunior` and `guardian`, and `viewerIsManager:
  true`. The manager can open the team without being on it. `/api/v1/player/memberships` lists
  that team under `managedTeams`.
- **Club admin routes** (`/api/v1/club-admin/players/:id`): a player's detail page only answers for
  a member of the administrator's own club (any other player is a 404), and includes `guardian`.
  The registry search (`/api/v1/club-admin/registry/players`) never sends a date of birth, email
  or phone for anyone; for a junior it also sends `otherClubs: []` and `isJunior: true`.
- **Association admin routes** (`/api/v1/association-admin/juniors`): only a user with an
  unrevoked `ADMINISTRATOR` role for an association is let through (403 `NOT_ASSOCIATION_ADMIN`
  otherwise, including club admins, team managers, records secretaries and players). The
  association comes from the role, never from the request.

**The age check.** A section's `min_age` and `max_age` are inclusive and apply on the **season's
first day**: "12 & Under" (`max_age` 12) means 12 or younger on that day, so a 13th birthday on
the first day is too old. A section with no limit, or a season with no start date, has nothing to
check (`eligible: null`).

## Test data

`npm run data:generate` adds Weekend Junior's Summer 2026/27 season (UPCOMING, no draw yet) with
three teams and ten juniors. Every account uses the password `WaverleyDev#2026`.

| Log in as | To see |
| --- | --- |
| `leo.fitzgerald@juniors.example` | A junior's own details (Glen Waverley 18U) |
| `maya.okafor@juniors.example` | A teammate's view: names only |
| `adaeze.okafor@families.example` | A parent who manages Glen Waverley 18U: parent contacts |
| `margaret.hayes@admin.example` | Glen Waverley's club admin: every detail of its seven juniors |
| `peter.lawson@admin.example` | Mount Waverley's club admin: Glen's juniors by name only |
| `raj.mitchell001@players.example` | Waverley Tennis's administrator: every junior, with age checks |

Ruby Achebe is 13 on the season's first day but entered in 12 & Under on purpose, so the age
check has something to find. `data:check` fails if no junior is outside their section's limit, if
`is_junior` disagrees with a date of birth, if a junior has no parent contact, or if a parent
email is not on a reserved `.example` domain.

## Tests

| IDs | What | Where |
| --- | --- | --- |
| JUNIOR-001..014 | Each rule against a fake database, through the real routes | `backend/test/club-admin.test.cjs`, `club-admin-edit.test.cjs`, `player.test.cjs`, `dashboard.test.cjs`, `association-admin.test.cjs` |
| JUNIOR-101..110 | Each role through the real API on the real seeded data, rolled back afterwards | `backend/test/junior-privacy.integration.cjs` (`npm run test:database`) |
| JUNIOR-UI-001..007 | Each page shows what it is sent, and says why | `frontend/tests/junior-privacy.test.tsx` |
| E2E-019..024 | Each role logs in and looks, in Chrome | `e2e/junior-privacy.spec.ts` |

Open questions about these rules are listed in [hardcoded-values.md](hardcoded-values.md) §4 (l to r).
