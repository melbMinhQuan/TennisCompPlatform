# TennisComp

Waverley Tennis Association team management system: Vite + React frontend, NestJS backend,
PostgreSQL database through Prisma.

Team coding conventions are in `coding_standards.docx`. Read it before your first commit.

## How to run

### You need

- **Node.js 20.12 or newer**
- **Docker Desktop**, running
- **`docker-compose.yml`**: it is not in the repo. Ask the team in the group chat and save it in the
  project root.

### First time only

Run from the project root:

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d                          # start the database
cd backend
npx prisma generate                           # build the database client
npx prisma migrate deploy                     # create the tables
npm run seed:competition                      # fill them with the test data
cd ..
```

Every step is needed. Without `migrate deploy` every query fails with
`relation "user" does not exist`. Without `seed:competition` the tables are empty.

### Every day

Use two terminals, both in the project root:

```bash
docker compose up -d        # database (skip if already running)
npm run dev:backend         # terminal 1 → http://localhost:3000
npm run dev:frontend        # terminal 2 → http://localhost:5173
```

Open **http://localhost:5173** and log in.

### Logging in

Every test account uses the same password:

```text
chloe.cooper005@players.example
WaverleyDev#2026
```

Any address ending in `.example` from the `User` sheet of the workbook works. Chloe Cooper is the
player the logged-out preview copies, so logging in as her is the quickest check that everything
is connected.

### If something goes wrong

| Problem | Fix |
| --- | --- |
| `EADDRINUSE :::3000` | A backend is already running. Stop it: `lsof -ti:3000 \| xargs kill` |
| `Port 5173 is in use` | Another frontend is running. Stop it: `lsof -ti:5173 \| xargs kill`. The frontend must use 5173, because the backend only accepts requests from there. |
| `relation "user" does not exist` | Run `npx prisma migrate deploy` in `backend/` |
| Pages are empty after logging in | Run `npm run seed:competition` in `backend/` |
| `PLAYER_PROFILE_NOT_LINKED` | You used an old account (e.g. `@outlook.com`). Use a `.example` address. |
| Logged out after refreshing | Expected for now: the login is kept only in page memory. Log in again. |
| Database won't start | Open Docker Desktop, and check `docker-compose.yml` is in the project root |

### Other commands

```bash
npm test                                  # unit + integration tests (no database needed)
npm run test:e2e                          # end-to-end tests in Chrome (database must be running and seeded)
npm run prisma:studio --workspace=backend # browse the database in your browser
```

## Testing

`TestingPlan.xlsx` lists every test: its ID, what it checks, and how to run it.
Each automated test's name starts with its ID (e.g. `AUTH-002`), so a failure points straight to
its row.

| Type | What it covers | Where | Run with |
| --- | --- | --- | --- |
| Unit | One function or service, with a fake database | `backend/test/`, `frontend/tests/` | `npm test` |
| Integration | A real HTTP route, or a rendered React component | same folders; `I-` IDs | `npm test` |
| End to end | The whole app in Chrome against the real seeded database | `e2e/` | `npm run test:e2e` |

`npm run test:e2e` reuses the backend and frontend if they're already running; otherwise it starts
them. It uses your installed Google Chrome. When a test fails, a screenshot and a step-by-step
trace are saved in `test-results/`.

**CI:** GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request, in two jobs:
- **test-and-build:** unit and integration tests, then the frontend build.
- **end-to-end:** creates an empty database, migrates and seeds it, starts the app and runs the
  end-to-end tests. This also proves a brand-new setup works.

A red ❌ on a pull request means something broke; open the run to see which test ID failed. For an
end-to-end failure, download the `playwright-report` file attached to the run.

## Test data

`backend/prisma/competition_data.xlsx` holds all the test data: one sheet per table, about 8,900
rows. It covers two associations, twelve clubs, five competitions, 292 fixtures, 274 results,
ladders, standings, UTR ratings and notifications. Names and match formats are real; dates of
birth, phone numbers, ratings and contact details are made up (see the `README` sheet inside it).

```bash
cd backend
npm run seed:competition              # load it (safe to re-run; only inserts what is missing)
npm run seed:competition -- --dry-run # show what it would do, write nothing
npm run seed:competition -- --sync    # make the database match the workbook exactly
```

**To change the data, edit the generator, not the spreadsheet.** A hand-edit is lost the next time
anyone regenerates it:

```bash
npm run data:generate                 # rebuild competition_data.xlsx
npm run data:check                    # validate it (must pass before committing)
npm run seed:competition -- --sync    # load it; use --sync because codes may have shifted
```

`--sync` also deletes rows the workbook no longer has, including rows you edited by hand. It
never deletes login accounts it doesn't recognise.

## Database

PostgreSQL 16 runs in Docker. `docker compose down` stops it and keeps the data;
`docker compose down -v` deletes the data too.

After changing `backend/prisma/schema.prisma`, create a migration:

```bash
npm run prisma:migrate --workspace=backend -- --name describe_your_change
```

Teammates then run `npx prisma migrate deploy` and `npx prisma generate` in `backend/`.

Passwords are stored only as bcrypt hashes, which is why the workbook is safe to commit.
`prisma/seed.ts` and `prisma/seed-dashboard.ts` are old seeds that need a git-ignored
plain-text password file. Don't use them.

## API

All player routes take `?email=` (the logged-in player's address) and answer `{ "data": ... }`.

| Route | Returns | Used by |
| --- | --- | --- |
| `POST /auth/login` | `{ "result": "login_success" }` or `"login_failed"` (both status 200) | Login |
| `GET /api/v1/player-dashboard` | Profile, UTR, career summary, 4 newest notifications | Profile |
| `GET /api/v1/player-dashboard/notifications` | All notifications and the unread count | Notifications → View All |
| `GET /api/v1/player/competitions` | One entry per active team, with its next fixture | Competitions |
| `GET /api/v1/player/fixtures` | All fixtures of the player's teams | Matches → Upcoming |
| `GET /api/v1/player/results` | The player's finalised rubbers, newest first | Matches → History, Recent Activity |
| `GET /api/v1/player/memberships` | Association and club memberships, teams | My Clubs |
| `GET /api/v1/player/teams/:teamId` | Team details and roster (own teams only) | Team Details |
| `GET /api/v1/player/standings` | Ladders, player standings, UTR rankings | Standings & Rankings |
| `GET /api/v1/player/support-contacts` | Team manager, club admin, records secretary | Help & Support |

Errors: `400` for a bad email or team ID. `404` with `USER_NOT_FOUND`,
`PLAYER_PROFILE_NOT_LINKED` or `TEAM_NOT_FOUND`. `503 DATA_UNAVAILABLE` when the database can't be
read.

**The email is a demo lookup, not real authentication.** These routes refuse all requests when
`NODE_ENV=production`, until proper sessions are built.

A rubber's winner is its recorded `winner_side` (retirements, walkovers) or, otherwise, whoever won
more sets, then more games.

The UTR integration is documented separately: [UTR integration](backend/src/utr/README.md).
[docs/hardcoded-values.md](docs/hardcoded-values.md) lists what the frontend still hardcodes, and
the open decisions.

### Settings (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | required | Database connection |
| `PORT` | `3000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend address(es) allowed to call the API, comma-separated |
| `UTR_PROVIDER` | `disabled` | `disabled`, `mock` or `engage` |

## Project structure

```text
TennisComp/
├── frontend/
│   ├── api/              # All backend calls (client.ts sends them)
│   ├── pages/            # One file per route
│   ├── components/       # Page sections, grouped by page
│   ├── data/             # Logged-out sample data and help content
│   └── utils/            # Formatting helpers
├── backend/
│   ├── prisma/           # Schema, migrations, test data workbook, seed and checks
│   ├── src/
│   │   ├── auth/         # Login
│   │   ├── dashboard/    # Profile dashboard and notifications
│   │   ├── player/       # /api/v1/player/* routes
│   │   ├── common/       # Shared DTO, guard, helpers
│   │   ├── utr/          # UTR provider scaffold
│   │   └── prisma/       # Database client for NestJS
│   └── test/             # Backend tests
├── docs/                 # API contracts and design notes
└── docker-compose.yml    # Database container (git-ignored, shared in the chat)
```
