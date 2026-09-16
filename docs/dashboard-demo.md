# Running the database dashboard showcase

This implementation adds a separate dashboard module and `/demo` frontend page.
The existing authentication controller/service/module, schema and seed are unchanged.
The existing app files only register the new module, page and navigation link.

## Run

PostgreSQL must be running and the existing migrations applied. From the repository
root, build and start the backend with its environment loaded explicitly:

```bash
npm run build --workspace=backend
node --env-file=backend/.env backend/dist/main.js
```

In another terminal:

```bash
npm run dev --workspace=frontend
```

Open **http://localhost:5173/demo**. The frontend defaults to backend port 3000,
or uses `VITE_API_URL` if configured. Use localhost and port 5173 to match the
existing backend CORS configuration.

Log in using an existing account from your local spreadsheet. Passwords are sent
only to the existing login endpoint; the demo does not store them. On successful
login the frontend requests the dashboard using that submitted email. Logout clears
the email/data in memory and aborts pending requests. Refreshing the browser requires
logging in again; there is no new session implementation.

## Implemented routes

Base: `http://localhost:3000/api/v1`. All routes require `email`.

| Request | Behavior |
| --- | --- |
| `GET /player-dashboard?email=...` | Profile, memberships, current rating, 3 upcoming fixtures, 3 finalised results, career count |
| `GET /player-dashboard/schedule?email=...` | Paginated upcoming team fixtures |
| `GET /player-dashboard/schedule?email=...&scope=all` | Full schedule including past/cancelled fixtures |
| `GET /player-dashboard/results?email=...` | Paginated finalised individual results and scores |
| `GET /player-dashboard/notifications?email=...` | Explicit unavailable state after verifying the profile exists |
| `GET /player-dashboard/utr-history?email=...&discipline=SINGLES` | Explicit unavailable state after verifying the profile exists |

The table paths are relative to `/api/v1`. Schedule/results accept `limit` (default
20, maximum 100), `cursor`, `from`, `to`, and `competitionId`. Only schedule uses
`scope=upcoming|all`. Profile preview cursors continue the corresponding default
full-list query. Dates/filter/cursor errors return `400 INVALID_QUERY`.

```bash
curl --get 'http://localhost:3000/api/v1/player-dashboard' \
  --data-urlencode 'email=your-existing-account@example.com'
```

Lookups use `User.email → Player.userId`. No matching user gives `404 USER_NOT_FOUND`.
An existing account with no linked profile gives:

```json
{
  "statusCode": 404,
  "code": "PLAYER_PROFILE_NOT_LINKED",
  "message": "Login account found, but it does not have a linked player profile yet."
}
```

This is the expected live result with the current local seed: 100 users and zero
players. To see populated cards, import actual player records and related data,
linking each Player's `userId` to its existing User. No sample records are inserted
by the showcase. After that data is available, the same queries return it automatically.

## Current limits

- The UI can select the correct player, but an email query does not prove ownership.
  These demo endpoints reject requests when `NODE_ENV=production`. Until the auth
  owner adds a session/token, use this only for local development. A production
  deployment must actually set NODE_ENV; this guard is not user authentication.
- A future authenticated controller can resolve the verified user ID to a player
  and reuse the player-based query methods. Do not trust a browser-supplied player
  ID as the replacement for authentication.
- UTR discipline, categories, percentile, history, venues, titles and notifications
  remain unknown/unavailable because their data sources are missing.
- No individual winner is stored, and the match-format rules are free text.
  This first implementation returns scores but leaves outcomes/win percentage
  unknown instead of inferring wins from incomplete or custom-format matches.
  `matchesPlayed` counts finalised personal rubbers; `unknownOutcomes` counts those
  records. With no results wins/losses are 0; otherwise they are null.
- Team fixtures are not proof of individual participation. Only active team
  memberships supply the schedule. Results use actual RubberPlayer participation,
  including matches on teams the player has since left.
- For the small MVP dataset, list queries load that player's rows and paginate
  in memory. Larger datasets should move filtering/pagination/aggregates into SQL.
- The broader routes in `dashboardapi.md` (messages, rankings, detail pages, writes,
  etc.) remain future design. The showcase provides working schedule/results lists
  and disabled/unavailable states for unimplemented features.

## Verify

```bash
npm run build --workspace=backend
node --test backend/test/dashboard.test.cjs
npm run build --workspace=frontend
```

The HTTP tests use in-memory Prisma query fixtures to check two different player
lookups, result perspective, cursor/filter behavior, missing profiles, database
failure and the production guard. They do not insert or alter any database data.
