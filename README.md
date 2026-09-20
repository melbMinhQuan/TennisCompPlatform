# TennisComp

Waverley Tennis Association team management system. Vite + React frontend, NestJS backend,
PostgreSQL database through Prisma.

Team coding conventions are in `coding_standards.docx`. Read it before your first commit.

## First-time setup

`docker-compose.yml` is **not in this repo** — ask the team in the group chat and save it in the
project root before running the commands below. Without it `docker compose` has no
configuration and the database will not start.

`players_login_data.xlsx` (the 100 test accounts) must be in the project root or the seed step
below fails with "no such file". It is currently committed to the repo, so a fresh clone
already has it. Note that it is also listed in `.gitignore`, which has no effect on a file that
is already tracked — the team has not settled whether this file belongs in version control.

```bash
npm install
cp backend/.env.example backend/.env     # local DATABASE_URL
cp frontend/.env.example frontend/.env   # VITE_API_URL
docker compose up -d                     # starts PostgreSQL on :5432
npm run prisma:generate --workspace=backend
```

Then create the tables and load the test accounts:

```bash
cd backend
npx prisma migrate deploy   # applies the migrations in prisma/migrations
npx prisma db seed          # imports the 100 accounts from the spreadsheet
```

`migrate deploy` is required. The migration files being in the repo does not mean they have
been run against your database — without this step every query fails with
`relation "user" does not exist`.

You only do this once. `docker-compose.yml` and the `.env` files are git-ignored, so `git pull`
never overwrites or removes them. If someone changes `docker-compose.yml` they have to re-share
it in the chat — it is not version-controlled.

## Daily use

```bash
docker compose up -d   # if the database is not already running
npm run dev:backend    # http://localhost:3000
npm run dev:frontend   # http://localhost:5173
```

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



To generate data on the dashboard
```bash
node --env-file=backend/.env --import tsx backend/prisma/seed-dashboard.ts
```


Everyone else then runs `npx prisma migrate deploy` to catch up.

`npx prisma studio` opens a browser view of the data, which is the quickest way to check what
is actually in the database.

### Passwords

Passwords are stored as bcrypt hashes, never in plain text. The seed script hashes each
password from the spreadsheet before inserting it. A hash cannot be reversed, so logging in
compares the submitted password with `bcrypt.compare` rather than reading the stored value.

## API

UTR provider scaffold and client connection instructions: [UTR integration](backend/src/utr/README.md).
Supports development fixtures and an Engage API reader with a replaceable player-token store.

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
│   │   ├── schema.prisma     # Database models and connection settings
│   │   ├── migrations/       # Generated SQL, applied with `prisma migrate deploy`
│   │   └── seed.ts           # Imports the test accounts from the spreadsheet
│   ├── src/
│   │   ├── main.ts           # Starts the API server and enables CORS
│   │   ├── app.module.ts     # Registers the app's modules
│   │   ├── app.controller.ts # API routes
│   │   ├── auth/             # Login endpoint (controller, service, module)
│   │   └── prisma/           # PrismaService and the global PrismaModule
│   └── .env.example          # Example DATABASE_URL
├── docker-compose.yml        # PostgreSQL container (git-ignored, shared in the chat)
├── players_login_data.xlsx   # Test accounts used by the seed script
├── coding_standards.docx     # Team coding conventions
├── package.json              # Commands for both applications
└── README.md
```
