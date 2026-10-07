# TennisComp

Team management system for the Waverley Tennis Association.

| Part | Technology | Address when running |
| --- | --- | --- |
| Frontend | Vite + React | http://localhost:5173 |
| Backend | NestJS | http://localhost:3000 |
| Database | PostgreSQL 16 in Docker, accessed through Prisma | `localhost:5432` |
| Database browser | Prisma Studio | http://localhost:5555 |

Coding conventions are in `coding_standards.docx`.

---

## Quick start

All commands are run from the **project root** (the folder that contains this README) unless a
step says otherwise.

### Step 0: Requirements (once per computer)

1. Install **Node.js 20.12 or newer**. Check with `node -v`.
2. Install **Docker Desktop** and open it. It must be running every time you use the app.
3. Make sure **`docker-compose.yml`** is in the project root. It is git-ignored, so a fresh clone
   does not have it. If it is missing, create it with this content:

   ```yaml
   services:
     postgres:
       image: postgres:16
       container_name: tenniscomp-postgres
       restart: unless-stopped
       environment:
         POSTGRES_USER: tenniscomp
         POSTGRES_PASSWORD: tenniscomp
         POSTGRES_DB: tenniscomp
       ports:
         - '5432:5432'
       volumes:
         - tenniscomp-pgdata:/var/lib/postgresql/data

   volumes:
     tenniscomp-pgdata:
   ```

### Step 1: First-time setup (once, after cloning)

Copy and run this whole block:

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d
cd backend
npx prisma generate
npx prisma migrate deploy
npm run seed:competition
cd ..
```

What each line does:

| Command | Purpose |
| --- | --- |
| `npm install` | Installs the frontend and backend dependencies |
| `cp ... .env` | Creates the local settings files from the examples |
| `docker compose up -d` | Starts the PostgreSQL database in Docker |
| `npx prisma generate` | Builds the Prisma database client |
| `npx prisma migrate deploy` | Creates the database tables |
| `npm run seed:competition` | Fills the tables with the test data |

### Step 2: Start the app (every time)

Open **two terminals** in the project root and keep both open.

**Terminal 1: database + backend**

```bash
docker compose up -d
npm run dev:backend
```

**Terminal 2: frontend**

```bash
npm run dev:frontend
```

Then open **http://localhost:5173** in your browser.

To stop the app, press `Ctrl+C` in each terminal. The database keeps running in Docker; stop it
with `docker compose down` (your data is kept).

### Step 3: Log in

All test accounts share one password:

| Email | Password |
| --- | --- |
| `chloe.cooper005@players.example` | `WaverleyDev#2026` |
| `raj.mitchell001@players.example` | `WaverleyDev#2026` |

Every other `.example` address in the `User` sheet of `backend/prisma/competition_data.xlsx` also
works with the same password.

### Step 4 (optional): Browse the database

Open a third terminal in the project root and run:

```bash
npm run prisma:studio --workspace=backend
```

Then open **http://localhost:5555**. Prisma Studio only runs while this terminal is open, so
http://localhost:5555 will not load unless this command is running.

Other ways to open the database:

- **Command line:**

  ```bash
  docker exec -it tenniscomp-postgres psql -U tenniscomp -d tenniscomp
  ```

  Inside psql: `\dt` lists the tables, `SELECT * FROM "User" LIMIT 5;` shows rows (keep the
  double quotes), `\q` quits.

- **A database app** (DBeaver, TablePlus, pgAdmin): host `localhost`, port `5432`, database
  `tenniscomp`, user `tenniscomp`, password `tenniscomp`.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Cannot connect to the Docker daemon` / database won't start | Open Docker Desktop and wait until it is running. Check `docker-compose.yml` is in the project root. |
| `EADDRINUSE :::3000` | A backend is already running. Stop it: `lsof -ti:3000 \| xargs kill` |
| `Port 5173 is in use` | Another frontend is running. Stop it: `lsof -ti:5173 \| xargs kill`. The frontend must use port 5173, because the backend only accepts requests from there. |
| `relation "user" does not exist` | Tables are missing. Run `npx prisma migrate deploy` in `backend/`. |
| Pages are empty after logging in | No test data. Run `npm run seed:competition` in `backend/`. |
| `PLAYER_PROFILE_NOT_LINKED` | You used an old account (e.g. `@outlook.com`). Use a `.example` address. |
| Logged out after refreshing | Expected for now: the login is kept only in page memory. Log in again. |
| http://localhost:5555 won't load | Prisma Studio isn't running. Run `npm run prisma:studio --workspace=backend`. |
| Errors after pulling new code | The schema or dependencies may have changed. Run `npm install`, then in `backend/`: `npx prisma migrate deploy` and `npx prisma generate`. |

---

## Commands

| Command (from the project root) | What it does |
| --- | --- |
| `npm run dev:backend` | Starts the backend on port 3000 |
| `npm run dev:frontend` | Starts the frontend on port 5173 |
| `npm run prisma:studio --workspace=backend` | Opens the database in the browser on port 5555 |
| `npm test` | Unit and integration tests (no database needed) |
| `npm run test:e2e` | End-to-end tests in Chrome (database must be running and seeded) |
| `docker compose up -d` | Starts the database |
| `docker compose down` | Stops the database and keeps the data |
| `docker compose down -v` | Stops the database and **deletes all data** |

---

## Testing

`TestingPlan.xlsx` lists every test: its ID, what it checks, and how to run it. Each automated
test's name starts with its ID (e.g. `AUTH-002`), so a failure points straight to its row.

| Type | What it covers | Where | Run with |
| --- | --- | --- | --- |
| Unit | One function or service, with a fake database | `backend/test/`, `frontend/tests/` | `npm test` |
| Integration | A real HTTP route, or a rendered React component | same folders; `I-` IDs | `npm test` |
| End to end | The whole app in Chrome against the real seeded database | `e2e/` | `npm run test:e2e` |

`npm run test:e2e` reuses the backend and frontend if they are already running; otherwise it
starts them. It uses your installed Google Chrome. When a test fails, a screenshot and a
step-by-step trace are saved in `test-results/`.

**CI:** GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request, in two
jobs:

- **test-and-build:** unit and integration tests, then the frontend build.
- **end-to-end:** creates an empty database, migrates and seeds it, starts the app and runs the
  end-to-end tests.

A red ❌ on a pull request means something broke; open the run to see which test ID failed. For an
end-to-end failure, download the `playwright-report` file attached to the run.

---

## Test data

`backend/prisma/competition_data.xlsx` holds all the test data: one sheet per table, about 8,900
rows. It covers two associations, twelve clubs, five competitions, 292 fixtures, 274 results,
ladders, standings, UTR ratings and notifications. Names and match formats are real; dates of
birth, phone numbers, ratings and contact details are made up (see the `README` sheet inside it).

Run these in `backend/`:

```bash
npm run seed:competition              # load the data (safe to re-run; only inserts what is missing)
npm run seed:competition -- --dry-run # show what it would do, write nothing
npm run seed:competition -- --sync    # make the database match the workbook exactly
```

**To change the data, edit the generator, not the spreadsheet.** A hand-edit is lost the next time
the workbook is regenerated:

```bash
npm run data:generate                 # rebuild competition_data.xlsx
npm run data:check                    # validate it (must pass before committing)
npm run seed:competition -- --sync    # load it; use --sync because codes may have shifted
```

`--sync` also deletes rows the workbook no longer has, including rows you edited by hand. It
never deletes login accounts it does not recognise.

Passwords are stored only as bcrypt hashes, which is why the workbook is safe to commit.

---

## Changing the database schema

After editing `backend/prisma/schema.prisma`, create a migration from the project root:

```bash
npm run prisma:migrate --workspace=backend -- --name describe_your_change
```

To apply migrations that came with new code, run in `backend/`:

```bash
npx prisma migrate deploy
npx prisma generate
```

---

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

---

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
└── docker-compose.yml    # Database container (git-ignored, see Quick start step 0)
```
