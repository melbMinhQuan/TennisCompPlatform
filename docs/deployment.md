# Deployment (Azure)

The live site runs on Microsoft Azure and updates itself whenever `main` changes.
This page explains what is deployed where, how a release works, and what to do
when something breaks. No passwords or keys are in this file; they live only in
Azure and in GitHub Secrets.

**The live site holds fake test data only.** The player and club-admin routes look
data up by an email in the request, with no session check, so anyone who knows an
email can read that profile. Do not load real people's details until real
authentication exists. See [Security](#security).

---

## What is where

| Part | Azure service | Name | Region | Address |
| --- | --- | --- | --- | --- |
| Frontend (React) | Static Web Apps, Free | `tenniscomp-web` | Global | https://delightful-pond-03c981700.5.azurestaticapps.net |
| Backend (NestJS) | App Service, Linux, Node 22, Free F1 | `tenniscomp` | New Zealand North | https://tenniscomp-dkdxhgawdsbnfwgw.newzealandnorth-01.azurewebsites.net |
| Database | PostgreSQL Flexible Server, Burstable B1ms | `tennis-db` | Canada Central | `tennis-db.postgres.database.azure.com:5432`, database `postgres` |

All three are in the **Azure for Students** subscription. The frontend and database
are in resource group `tenniscomp-rg`; the backend is in `tenniscomp_group`.
Resource groups are only folders, so the split changes nothing at runtime.

```text
Browser ──► Static Web Apps (HTML, JS, CSS)
   │
   └─ API calls ──► App Service: node dist/main.js ──► PostgreSQL (tennis-db)
```

The frontend is plain files served from Azure's edge; the React code runs in the
visitor's browser and calls the backend address that was baked in at build time.

---

## How a release works

| Branch | Purpose | Deploys? |
| --- | --- | --- |
| `feature/*` | One piece of work, branched from `develop` | No |
| `develop` | Where features are merged through pull requests | No |
| `main` | What is live | **Yes, automatically** |

To release, open a pull request from `develop` into `main` and merge it once CI is
green. Two workflows then run (watch them in the repository's **Actions** tab):

| Workflow | File | Takes | What it does |
| --- | --- | --- | --- |
| Deploy backend | [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) | ~5 min | Builds the backend, packages `dist/`, `prisma/` and `package.json` with their own `node_modules`, uploads to App Service |
| Deploy frontend | [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) | ~2 min | Builds the frontend with `VITE_API_URL` set to the backend address, uploads `frontend/dist` |

Both can also be started by hand: **Actions → the workflow → Run workflow**.

After the backend upload, App Service restarts the app with this startup command:

```bash
npx prisma migrate deploy && node dist/main.js
```

So **a release that adds a Prisma migration applies it to the live database
automatically.** The first request after a restart can take a few minutes while
the app starts; App Service answers `503` until then.

### Why the backend is packaged separately

npm workspaces keep every dependency in the root `node_modules`, so uploading the
`backend/` folder on its own would start with missing modules. The workflow builds
in the full workspace, then installs the backend's production dependencies (plus the
Prisma CLI, for the migration step) into a separate `deploy/` folder and uploads that.

### Refreshing a page

[`frontend/public/staticwebapp.config.json`](../frontend/public/staticwebapp.config.json)
tells Static Web Apps to serve `index.html` for any unknown path, so refreshing
`/dashboard` reaches React Router instead of returning 404.

---

## Configuration

### Backend: App Service → Settings → Environment variables

| Name | Value |
| --- | --- |
| `DATABASE_URL` | `postgresql://<admin>:<url-encoded password>@tennis-db.postgres.database.azure.com:5432/postgres?sslmode=require` |
| `CORS_ORIGIN` | `https://delightful-pond-03c981700.5.azurestaticapps.net` (no trailing `/`) |
| `UTR_PROVIDER` | `disabled` |

`PORT` is set by App Service and must not be added. **Do not add
`NODE_ENV=production`**: `DemoEmailGuard` then refuses every player route with
`403 DEMO_DISABLED`, and the site loads with no data.

Other backend settings that must stay as they are:

- **Configuration → Stack settings → Startup command:** the command above.
- **Configuration → General settings → SCM Basic Auth Publishing Credentials:** On.
  The deploy workflow logs in with the publish profile, which needs it.

### Frontend

`VITE_API_URL` is set in `deploy-frontend.yml`, not in Azure, because Vite bakes it
into the JavaScript at build time. If the backend address changes, change it there
and redeploy.

### GitHub → Settings → Secrets and variables → Actions

| Secret | Where it comes from |
| --- | --- |
| `AZURE_BACKEND_PUBLISH_PROFILE` | Backend → Overview → Download publish profile (the whole file's contents) |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | `tenniscomp-web` → Overview → Manage deployment token |

If either is reset in Azure, paste the new value into the secret, or deployments fail.

---

## Database

The live database was created with `prisma migrate deploy` and filled with
`npm run seed:competition` from `develop`, run from a developer's machine.

### Running a command against the live database

From `backend/` in a terminal. The password is typed at a hidden prompt and
URL-encoded, so special characters cannot break the connection string:

```zsh
cd backend
read -s "PW?Azure database password: "; echo
export DATABASE_URL="postgresql://<admin>:$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$PW")@tennis-db.postgres.database.azure.com:5432/postgres?sslmode=require"
npx prisma migrate deploy      # normally not needed: the backend runs this on start
npm run seed:competition       # add rows the workbook has that the database lacks
```

The setting lasts only for that terminal window. Your machine's IP must be allowed
in **tennis-db → Networking → Firewall rules**; add it with **+ Add current client IP
address** if you get `P1001 Can't reach database server`.

### Changing the test data

Migrations reach the live database automatically, but **test data does not.** After
a release that changes `competition_data.xlsx`, someone with the password runs the
seed again:

- `npm run seed:competition` only inserts rows that are missing.
- `npm run seed:competition -- --sync` makes the database match the workbook exactly,
  including deleting rows it no longer contains. Run it with `--dry-run` first.

### Test accounts

Every row of the `User` sheet in `backend/prisma/competition_data.xlsx` can log in,
all with the development password in the [README](../README.md). For example
`chloe.cooper005@players.example` (player), `margaret.hayes@admin.example`
(club admin) and `raj.mitchell001@players.example` (association administrator).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Site slow or `503` on the first visit | Free F1 backend was asleep or is restarting | Wait up to a few minutes; it is fast afterwards |
| Login fails with a network or CORS error in the browser console | `CORS_ORIGIN` does not exactly match the frontend address | Fix it in the backend's environment variables (`https`, no trailing `/`) |
| Every player page shows `403 DEMO_DISABLED` | `NODE_ENV=production` was added | Remove it |
| Backend shows "Application Error" | The app crashed on start | Backend → **Log stream**, then read the last error |
| `P1000 Authentication failed` in the log | Wrong `DATABASE_URL` password, or not URL-encoded | Re-enter it in the environment variables |
| Deploy backend fails at the upload step | Publish profile was reset, or basic auth was turned off | Turn SCM Basic Auth back on, download a new profile, update the secret |
| Deploy frontend fails at the upload step | Deployment token was reset | Copy a new token into the secret |
| Pages slower than locally | Backend (New Zealand) and database (Canada) are in different regions, so every query crosses the Pacific | Expected; recreate them in one region to fix |

---

## Security

- **No real authentication yet.** `/api/v1/player-dashboard`, `/api/v1/player/*` and
  `/api/v1/club-admin/*` trust the email in the request. Logging in returns
  `login_success` and nothing the server checks later.
- **The repository is public**, including the README with the shared development
  password. Never commit passwords, `.env` files, connection strings, publish
  profiles or tokens. If one is committed, change it in Azure; deleting the file in a
  later commit does not remove it from history.
- **Login has no attempt limit**, so passwords can be guessed without slowdown.
- **The app connects as the database admin.** A separate database user with only
  the rights the app needs would limit the damage of a leaked `DATABASE_URL`.

Before real users: real sessions or JWT checked on every request, individual
passwords, login rate limiting, a least-privilege database user, and test data
kept out of a public repository.

---

## Cost

Azure for Students pays from its US$100 credit; there is no card on file.

| Resource | Plan | Cost |
| --- | --- | --- |
| Static Web Apps | Free | $0 |
| App Service | Free F1 | $0 (sleeps when idle, daily CPU limit) |
| PostgreSQL | Burstable B1ms, 32 GiB Premium SSD | Covered by the free services allowance where it applies; otherwise about US$15–25/month |

Cost depends on how long things are switched on, not on visitors. To save credit,
**Stop** the database from its Overview page when the site is not needed; only
storage is charged while stopped, and Azure starts it again after 7 days. A budget
alert under **Cost Management → Budgets** warns before credit runs out.
