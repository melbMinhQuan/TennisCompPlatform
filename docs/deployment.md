# Deployment (Azure)

The live site runs on Microsoft Azure and updates itself whenever `main` changes and
every test passes.
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
| `main` | What is live | **Yes, automatically, once every test passes** |

To release, open a pull request from `develop` into `main` and merge it once CI is
green. The merge starts the **CI** workflow on `main` (watch it in the repository's
**Actions** tab). It runs every check again ([README → Testing](../README.md#testing)),
and only if all of them pass does it release, one step at a time:

```text
test-and-build ─┐
end-to-end ─────┼─► deploy-backend ──► deploy-frontend
backend-package ┘   (tested package,    (build, upload, check the pages,
                     check the live API) then a browser logs in to the live site)
```

| Deploy | File | Takes | What it does |
| --- | --- | --- | --- |
| Backend | [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) | ~3 min | Uploads to App Service the package that the `backend-package` job built and tested, then checks the live API |
| Frontend | [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) | ~5 min | Builds the frontend with `VITE_API_URL` set to the backend address, uploads `frontend/dist`, checks its pages, then checks the whole live site in a browser |

A failing check stops the release where it is. A failure before `deploy-backend` leaves the
live site on the previous version. If the backend deploy fails its check, the frontend is not
deployed.

There is no separate "deploy by hand". To redeploy, open the latest CI run on `main` and
choose **Re-run all jobs**: it runs every check again, then releases the same commit.

### Checking the live site after a deploy

Each deploy ends by running [`.github/scripts/smoke-test.mjs`](../.github/scripts/smoke-test.mjs)
against the live site. It keeps trying for up to 5 minutes, because the backend restarts
(and runs migrations) after an upload. Then a browser runs
[`e2e/live/live-site.spec.ts`](../e2e/live/live-site.spec.ts) against the live site.

| After | Check | Fails when |
| --- | --- | --- |
| Backend deploy | `POST /auth/login` with an unknown email answers `login_failed` and allows the frontend's address (CORS) | The app did not start, cannot reach the database, or `CORS_ORIGIN` is wrong |
| Backend deploy | `GET /api/v1/club-admin/dashboard` with an unknown email answers `401`, and CORS lets the frontend send `PUT`, `PATCH` and `DELETE` (only the club admin pages send them) | The club admin routes are missing, `NODE_ENV=production` was added (`403 DEMO_DISABLED`), or something in front of the app blocks those methods |
| Frontend deploy | `/` and `/dashboard` both load the React app | The upload failed, or `staticwebapp.config.json` is missing |
| Frontend deploy | LIVE-001: `charlotte.reed004@players.example` logs in and her whole dashboard loads | Anything between the page and the database: the backend address baked into the bundle, CORS, the API, the data |
| Frontend deploy | LIVE-002: `margaret.hayes@admin.example` logs in, and her club's dashboard, Players, Teams and Fixtures & Results pages load without an error | The same chain for the club admin pages and routes |

The browser check logs in as Charlotte rather than Chloe because the logged-out sample profile
is also "Chloe Cooper", so only real data can show Charlotte's name. The club admin pages have no
sample data at all. Both checks only read: they never change the live database. **Keep both
accounts in the live database**, or change the emails in the spec.

A failed check turns the run red, but the new version is already live by then. The
step's log says which check failed (a failed browser check also attaches a
`live-site-report` with screenshots); fix it using [Troubleshooting](#troubleshooting), or
revert the change on `main`. To run the checks yourself:

```bash
export BACKEND_URL=https://tenniscomp-dkdxhgawdsbnfwgw.newzealandnorth-01.azurewebsites.net
export FRONTEND_URL=https://delightful-pond-03c981700.5.azurestaticapps.net
node .github/scripts/smoke-test.mjs backend   # or frontend
npx playwright test --config=playwright.live.config.ts
```

After the backend upload, App Service restarts the app with this startup command:

```bash
npx prisma migrate deploy && node dist/main.js
```

So **a release that adds a Prisma migration applies it to the live database
automatically.** The first request after a restart can take a few minutes while
the app starts; App Service answers `503` until then.

### Why the backend is packaged separately

npm workspaces keep every dependency in the root `node_modules`, so uploading the
`backend/` folder on its own would start with missing modules. The `backend-package` job
in [`ci.yml`](../.github/workflows/ci.yml) builds in the full workspace, then installs the
backend's production dependencies (plus the Prisma CLI, for the migration step) into a
separate `deploy/` folder.

That install does not use the lockfile, so the package can hold newer dependency versions
than the tests ran with, or miss one that only the workspace provided. So the job starts
the package exactly as App Service will (the startup command above, on an empty database) and
checks it answers, on every push. On `main` it hands that same tested package
to the deploy, packed with `tar` so file permissions survive.

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
`NODE_ENV=production`**: the demo email lookup then refuses every player and club admin route
with `403 DEMO_DISABLED`, and the site loads with no data.

Other backend settings that must stay as they are:

- **Configuration → Stack settings → Startup command:** the command above.
- **Configuration → General settings → SCM Basic Auth Publishing Credentials:** On.
  The deploy workflow logs in with the publish profile, which needs it.

### Frontend

`VITE_API_URL` is set in `deploy-frontend.yml` (from `BACKEND_URL` at the top of the
file), not in Azure, because Vite bakes it into the JavaScript at build time. If the
backend or frontend address changes, update `BACKEND_URL` and `FRONTEND_URL` at the top
of both deploy workflows, then redeploy.

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
| Every player or club admin page shows `403 DEMO_DISABLED` | `NODE_ENV=production` was added | Remove it |
| Backend shows "Application Error" | The app crashed on start | Backend → **Log stream**, then read the last error |
| `P1000 Authentication failed` in the log | Wrong `DATABASE_URL` password, or not URL-encoded | Re-enter it in the environment variables |
| Deploy backend fails at the upload step | Publish profile was reset, or basic auth was turned off | Turn SCM Basic Auth back on, download a new profile, update the secret |
| Deploy frontend fails at the upload step | Deployment token was reset | Copy a new token into the secret |
| `backend-package` fails at **Check the package answers** | The packaged backend cannot start on its own: usually a package used in `backend/src` that is missing from `dependencies` in `backend/package.json` | Read **Show the backend's log** in the same job, add the missing dependency |
| `end-to-end` fails at **Check every schema.prisma change has a migration** | `schema.prisma` was changed without a migration | In `backend/`, run `npx prisma migrate dev --name <what-changed>` and commit the new migration folder |
| Every release fails at **Check the live backend** with `answered 500` | The database is stopped (see [Cost](#cost)) | Start it from its Overview page, then **Re-run all jobs** |
| **Check the whole live site in a browser** fails, the checks before it passed | Something between the page and the data, or the Charlotte or Margaret account is missing from the live database | Download `live-site-report` from the run for a screenshot; re-seed the live database if the account is gone |
| **Check the live backend** fails with `club-admin/dashboard answered 404` | The deployed backend is older than the frontend expects, or the club admin module failed to load | Read the backend's **Log stream**; **Re-run all jobs** to redeploy |
| **Check the live backend** fails with `CORS does not let … send PUT` (or `PATCH`, `DELETE`) | App Service's own CORS setting (backend → **API → CORS**) is answering the browser's preflight instead of the app; when it is set, the app's own CORS rules are ignored | Remove every origin there and leave it off: the app sets CORS itself from `CORS_ORIGIN` |
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
