# TennisComp

Waverley Tennis Association team management system. Vite + React frontend, NestJS backend,
PostgreSQL database through Prisma.

Team coding conventions are in `coding_standards.docx`. Read it before your first commit.

Requires Node.js 20.12 or newer (the backend loads `backend/.env` with `process.loadEnvFile`).

## First-time setup

`docker-compose.yml` is **not in this repo** — ask the team in the group chat and save it in the
project root before running the commands below. Without it `docker compose` has no
configuration and the database will not start.

```bash
npm install
cp backend/.env.example backend/.env     # local DATABASE_URL
cp frontend/.env.example frontend/.env   # VITE_API_URL
docker compose up -d                     # starts PostgreSQL on :5432
npm run prisma:generate --workspace=backend
```

Then create the tables and load the test data:

```bash
cd backend
npx prisma migrate deploy   # applies the migrations in prisma/migrations
npm run seed:competition    # loads competition_data.xlsx (~8,900 rows)
```

`migrate deploy` is required. The migration files being in the repo does not mean they have
been run against your database — without this step every query fails with
`relation "user" does not exist`.

`seed:competition` is required too. `migrate deploy` only creates empty tables; until you seed,
every table except `_prisma_migrations` has nothing in it. Each developer has their own local
database, so nobody else's seed reaches yours.

You only do this once. `docker-compose.yml` and the `.env` files are git-ignored, so `git pull`
never overwrites or removes them. If someone changes `docker-compose.yml` they have to re-share
it in the chat — it is not version-controlled.

## Daily use

```bash
docker compose up -d   # if the database is not already running
npm run dev:backend    # http://localhost:3000
npm run dev:frontend   # http://localhost:5173
```

Open http://localhost:5173 and log in (see [Logging in](#logging-in)). Every page then loads that
player's data from the backend. Without logging in, `/dashboard` shows a fixed sample player
(Chloe Cooper) instead. [docs/hardcoded-values.md](docs/hardcoded-values.md) lists everything
that is still hardcoded, and why.

The frontend must run on port 5173: the backend only accepts browser requests from
`CORS_ORIGIN` (default `http://localhost:5173`). Vite is set to `strictPort`, so if 5173 is
taken it stops with an error rather than moving to a port whose requests would all be refused.
Free the port, or set `CORS_ORIGIN` in `backend/.env` to match.

Run the backend tests with:

```bash
npm test --workspace=backend   # builds, then runs backend/test/*.test.cjs (no database needed)
```

## Test data

`backend/prisma/competition_data.xlsx` is the single source of test data: one sheet per
database table, about 8,900 rows. Open it to read the data without connecting to anything —
that is what it is for.

```bash
cd backend
npm run seed:competition              # load it into your local database
npm run seed:competition -- --dry-run # report what it would insert, write nothing
npm run seed:competition -- --sync    # make the database match the workbook
```

Safe to run more than once. Row ids are derived from the spreadsheet codes, so a second run
inserts nothing rather than duplicating. The script only ever inserts — it never updates or
deletes — so a row you edited by hand survives a re-run. Everything happens in one transaction,
so a failure leaves the database exactly as it was.

#### After regenerating the workbook

That insert-only guarantee assumes the workbook only ever grows. `npm run data:generate`
renumbers the sequential codes, so a row added in the middle pushes every later code onto
different data. A plain re-run cannot follow that: it skips every shifted row as already
present and leaves the superseded ones behind, reporting `0` inserted as though nothing needed
doing. Use `--sync` instead, which rewrites drifted rows and deletes rows the workbook no
longer defines:

```bash
npm run seed:competition -- --sync --dry-run   # see what would change first
npm run seed:competition -- --sync
```

`--sync` deletes, so unlike a seed it does not spare rows you added or edited by hand. The one
exception is `user`: the login seed puts accounts there that this workbook knows nothing about,
so a sync never deletes logins it does not recognise and reports them under `keptBecauseShared`.

### Logging in

Every generated account shares one development password:

```text
raj.mitchell001@players.example
WaverleyDev#2026
```

Any address from the `User` sheet works. All of them end in `.example`, a domain reserved for
documentation, so no message can ever reach a real mailbox.

`chloe.cooper005@players.example` is the player the logged-out sample preview copies. Logging
in as her should show the same pages with live data, which makes it the quickest check that
the frontend, backend and database are connected.

If you seeded this project before September 2026 you may still have 100 accounts on real
domains (`@outlook.com`, `@yahoo.com.au`) left over from the original account list. Those have
no player profile attached, so logging in with one succeeds but the dashboard returns
`404 PLAYER_PROFILE_NOT_LINKED`. Use a `.example` address instead.

### What is in it

Waverley Tennis: two associations, twelve clubs, thirteen venues, and five competitions with
every match format and eligibility rule from the association's format document.

Weekend Senior has three seasons — Winter 2025 and Summer 2025/26 are finished with finals and
premierships, Winter 2026 is mid-season with rounds still to play. Night Tennis has its own
completed season, which is what proves competitions run independently of each other. Together
that is 292 fixtures, 274 results, 822 rubbers, plus ladders, player standings, UTR history,
notifications, and a result workflow with confirmations, disputes and reviewed corrections.

Names and match formats are real; everything else is generated. Dates of birth, genders, phone
numbers, UTR ratings and club contact details are synthetic — see the `README` sheet inside the
workbook, which documents every assumption and flags each synthetic field.

### Changing the data

Edit the generator, not the spreadsheet. A hand-edit is overwritten the next time anyone
regenerates, and the checks below will not have seen it.

```bash
cd backend
npm run data:generate   # rebuild competition_data.xlsx
npm run data:check      # validate it
```

`data:check` runs two scripts. `check-data-integrity.js` reads `schema.prisma` and verifies
every foreign key resolves, every enum value is a real member, every unique constraint holds
and every score agrees with the rubber it belongs to. `check-competition-data.js` checks the
rules the data has to obey in the real world: legal tennis scores, singles played in order of
merit, matches starting at the advertised local time, finals drawn from the final ladder and
progressed by who actually won, emergency players who are not registered at a rival club,
ladders counting confirmed results only, and no real email address anywhere.

Both must pass before the workbook is committed. Each check exists because the data once broke
that rule, so please add to them rather than removing one that fails.

## Database

PostgreSQL 16 runs in Docker. Data lives in a named volume, so `docker compose down` stops the
container without losing anything; `docker compose down -v` also deletes the data.

The connection string is read from `backend/.env`:

```text
postgresql://tenniscomp:tenniscomp@localhost:5432/tenniscomp?schema=public
```

Prisma is wired into NestJS through a global `PrismaModule`, so `PrismaService` can be injected
into any service without importing the module again.

`schema.prisma` holds the full schema — users, players, clubs, competitions, fixtures, results
and the supporting tables. After changing it, create a migration with:

```bash
npm run prisma:migrate --workspace=backend -- --name describe_your_change
```

Everyone else then runs `npx prisma migrate deploy` to catch up. If the schema changed, run
`npx prisma generate` as well, or the Prisma client still describes the old tables.

`npx prisma studio` opens a browser view of the data, which is the quickest way to check what
is actually in the database.

### Passwords

Passwords are stored as bcrypt hashes, never in plain text. The `User` sheet carries the hash,
not the password, which is why the workbook is safe to commit. A hash cannot be reversed, so
logging in compares the submitted password with `bcrypt.compare` rather than reading the
stored value.

`prisma/seed.ts` and `prisma/seed-dashboard.ts` are the earlier, superseded seeds. They read
`players_login_data.xlsx`, which holds passwords in plain text and is git-ignored for that
reason, so a fresh clone cannot run them. Use `npm run seed:competition`; the workbook now
carries its own accounts.

## API

UTR provider scaffold and client connection instructions: [UTR integration](backend/src/utr/README.md).
Supports development fixtures and an Engage API reader with a replaceable player-token store.

| Method | Route | Body | Response |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ "email": "...", "password": "..." }` | `{ "result": "login_success" }` or `{ "result": "login_failed" }` |

Both outcomes return status 200, so check the `result` field rather than the status code. A
500 means the server could not reach the database, which is a different problem from a wrong
password.

### Player data

Every route below takes `?email=` (the logged-in player's address) and answers `{ "data": ... }`.
The response shapes are the frontend's own types, so the pages render them without mapping.
They are declared in `backend/src/player/player.types.ts` and mirrored in `frontend/api/`.

| Route | Returns | Frontend page |
| --- | --- | --- |
| `GET /api/v1/player-dashboard` | Profile, UTR rating, career summary, preview lists (incl. 4 newest notifications) | Profile |
| `GET /api/v1/player-dashboard/notifications` | All in-app notifications, newest first, plus unread count | Profile → Notifications → View All |
| `GET /api/v1/player/competitions` | One entry per active team, with its next fixture | My Competitions, Competition details |
| `GET /api/v1/player/fixtures` | Every fixture of the player's teams, all statuses | Upcoming fixtures, Fixture details |
| `GET /api/v1/player/results` | The player's finalised rubbers, newest first | Recent Activity, History, Scorecard |
| `GET /api/v1/player/memberships` | Association and club memberships, active teams | My Clubs & Associations & Teams |
| `GET /api/v1/player/teams/:teamId` | Team details and roster | Team Details |
| `GET /api/v1/player/standings` | Ladders, player standings, UTR rankings, finals | Standings & Rankings |
| `GET /api/v1/player/support-contacts` | Team manager, club admin, records secretary | Help & Support |

Errors, all with a `code` field: `400` for a missing or invalid email, or a team ID that is not
a UUID. `404 USER_NOT_FOUND` for an unknown account. `404 PLAYER_PROFILE_NOT_LINKED` for an
account with no player. `404 TEAM_NOT_FOUND` for a team the player is not on; another team's
roster is never returned. `503 DATA_UNAVAILABLE` when the database cannot be read.

A rubber's winner is its recorded `winner_side` when there is one (retirement, walkover,
forfeit). Otherwise it is whoever won more sets, then more games. Win % and titles on the
profile come from that rule and from `player_award`, where a title is a section or
competition win, not a runners-up award.

**The email is a local demo lookup, not authentication.** Anyone who knows an address can
read that player's data, so these routes refuse every request when `NODE_ENV=production`.
Real sessions still need to be built.

### Backend settings (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | none (required) | PostgreSQL connection |
| `PORT` | `3000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Browser origin(s) allowed to call the API, comma-separated |
| `UTR_PROVIDER` | `disabled` | `disabled`, `mock` or `engage`; see [UTR integration](backend/src/utr/README.md) |

The backend reads this file at startup. Variables already set in your shell take precedence.
The frontend sends requests with credentials, so CORS names the exact origin and allows
credentials; a wildcard origin would be rejected by the browser.

## Project structure

```text
TennisComp/
├── frontend/                 # Vite + React website
│   ├── api/                  # Every backend call; client.ts sends them, one adapter per resource
│   ├── pages/                # One file per route
│   ├── components/           # Page sections, grouped by page
│   ├── data/                 # Logged-out sample preview and static help content
│   ├── utils/                # Date and label formatting
│   ├── src.tsx               # React routes and navigation
│   ├── style.css             # Tailwind import and global styles
│   └── .env.example          # Example frontend API address
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma             # Database models and connection settings
│   │   ├── migrations/               # Generated SQL, applied with `prisma migrate deploy`
│   │   ├── competition_data.xlsx     # The test data, one sheet per table
│   │   ├── seed-competition.ts       # Loads it  — `npm run seed:competition`
│   │   ├── generate-competition-data.js  # Rebuilds it — `npm run data:generate`
│   │   ├── check-data-integrity.js   # Schema-level checks  — `npm run data:check`
│   │   ├── check-competition-data.js # Competition-rule checks — same command
│   │   ├── seed.ts                   # Superseded; see Passwords above
│   │   └── seed-dashboard.ts         # Superseded; see Passwords above
│   ├── src/
│   │   ├── main.ts           # Loads .env, enables CORS and validation, starts the server
│   │   ├── app.module.ts     # Registers the app's modules
│   │   ├── app.controller.ts # API routes
│   │   ├── auth/             # Login endpoint (controller, service, module)
│   │   ├── dashboard/        # Player dashboard endpoint
│   │   ├── player/           # /api/v1/player/* — competitions, fixtures, results, clubs, standings, contacts
│   │   ├── common/           # Shared DTO, demo guard, rubber-winner rule, error wrapper
│   │   ├── utr/              # UTR provider scaffold
│   │   └── prisma/           # PrismaService and the global PrismaModule
│   ├── test/                 # node:test suites — `npm test --workspace=backend`
│   └── .env.example          # Example DATABASE_URL, PORT, CORS_ORIGIN, UTR settings
├── docs/                     # API contracts, data gaps, and hardcoded-values.md
├── docker-compose.yml        # PostgreSQL container (git-ignored, shared in the chat)
├── coding_standards.docx     # Team coding conventions
├── package.json              # Commands for both applications
└── README.md
```

NOTE FOR ME
# 1. Start the database (only needed once — stays running until you stop it)
docker compose up -d

# 2. Backend (NestJS, watch mode) — run in one terminal tab
npm run dev:backend

# 3. Frontend (Vite) — run in another terminal tab
npm run dev:frontend

# 4. (optional) Prisma Studio to browse the DB in the browser
npm run prisma:studio --workspace=backend