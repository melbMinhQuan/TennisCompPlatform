# TennisComp

Minimal Vite + React frontend and NestJS backend, with a PostgreSQL database via Prisma.

## First-time setup

`docker-compose.yml` is **not in this repo** — ask the team for it in the group chat and save it
in the project root before running the commands below. Without it `docker compose` has no
configuration and the database will not start.

```bash
npm install
cp backend/.env.example backend/.env   # local DATABASE_URL
docker compose up -d                   # starts PostgreSQL on :5432
npm run prisma:generate --workspace=backend
```

You only do this once. `docker-compose.yml` and `backend/.env` are git-ignored, so `git pull`
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

`schema.prisma` has **no models yet**, which is why `prisma:generate` passes `--allow-no-models`
(Prisma otherwise refuses to generate a client, and the backend then crashes on boot). Once the
first model is added, create the tables with:

```bash
npm run prisma:migrate --workspace=backend -- --name init
```

The flag stays harmless after that.

## Project structure

```text
TennisComp/
├── frontend/             # Vite + React website
│   ├── pages/            # Website pages, such as Home and About
│   ├── src.tsx           # React routes and navigation
│   ├── style.css         # Tailwind import and global styles
│   └── .env.example      # Example frontend API address
├── backend/              # NestJS API
│   ├── prisma/
│   │   └── schema.prisma # Database models and connection settings
│   ├── src/
│   │   ├── main.ts       # Starts the API server
│   │   ├── app.module.ts # Registers the app's modules
│   │   ├── app.controller.ts # API routes
│   │   └── prisma/       # PrismaService and the global PrismaModule
│   └── .env.example      # Example DATABASE_URL
├── docker-compose.yml    # PostgreSQL container (git-ignored, shared in the chat)
├── package.json          # Commands for both applications
└── README.md
```
