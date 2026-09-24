# TennisComp

Waverley Tennis Association team management system. Vite + React frontend, NestJS backend,
PostgreSQL database through Prisma.

Team coding conventions are in `coding_standards.docx`. Read it before your first commit.

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

## Test data

`backend/prisma/competition_data.xlsx` is the single source of test data: one sheet per
database table, about 8,900 rows. Open it to read the data without connecting to anything —
that is what it is for.

```bash
cd backend
npm run seed:competition              # load it into your local database
npm run seed:competition -- --dry-run # report what it would insert, write nothing
```

Safe to run more than once. Row ids are derived from the spreadsheet codes, so a second run
inserts nothing rather than duplicating. The script only ever inserts — it never updates or
deletes — so a row you edited by hand survives a re-run. Everything happens in one transaction,
so a failure leaves the database exactly as it was.

### Logging in

Every generated account shares one development password:

```text
raj.mitchell001@players.example
WaverleyDev#2026
```

Any address from the `User` sheet works. All of them end in `.example`, a domain reserved for
documentation, so no message can ever reach a real mailbox.

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

| Method | Route | Body | Response |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ "email": "...", "password": "..." }` | `{ "result": "login_success" }` or `{ "result": "login_failed" }` |

Both outcomes return status 200, so check the `result` field rather than the status code. A
500 means the server could not reach the database, which is a different problem from a wrong
password.

The backend allows requests from `http://localhost:5173`, so the Vite dev server can call it
directly.

## Project structure

```text
TennisComp/
├── frontend/                 # Vite + React website
│   ├── pages/                # Website pages, such as Home and About
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
│   │   ├── main.ts           # Starts the API server and enables CORS
│   │   ├── app.module.ts     # Registers the app's modules
│   │   ├── app.controller.ts # API routes
│   │   ├── auth/             # Login endpoint (controller, service, module)
│   │   ├── dashboard/        # Player dashboard endpoint
│   │   └── prisma/           # PrismaService and the global PrismaModule
│   └── .env.example          # Example DATABASE_URL
├── docs/                     # API contracts and the dashboard data-gap list
├── docker-compose.yml        # PostgreSQL container (git-ignored, shared in the chat)
├── coding_standards.docx     # Team coding conventions
├── package.json              # Commands for both applications
└── README.md
```
