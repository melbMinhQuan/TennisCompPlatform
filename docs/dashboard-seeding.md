# Seed dashboard information for the existing 100 accounts

The separate `backend/prisma/seed-dashboard.ts` script uses the original
`players_login_data.xlsx` to match existing User emails and reuse their names.
It never changes accounts or passwords and does not call or replace `seed.ts`.

**All added dates of birth, genders, phone placeholders, ratings, clubs, teams
and matches are fictional demonstration data.** Gender is not inferred from names.
Phone values such as `DEMO-0001` are deliberately non-dialable. Ratings are not
downloaded from UTR. The seed creates an audit marker identifying the data source.

From the repository root, preview without writing:

```bash
node --env-file=backend/.env --import tsx backend/prisma/seed-dashboard.ts --dry-run
```

Populate the database:

```bash
node --env-file=backend/.env --import tsx backend/prisma/seed-dashboard.ts
```

Prerequisites: local PostgreSQL running, migrations applied, generated Prisma
client, the spreadsheet present at the repository root, and the original 100
accounts already created by the original seed. This script creates no new Users.

For 100 accounts without profiles, it adds:

| Data | Number |
| --- | ---: |
| Linked Player profiles | 100 |
| Current demo UTR ratings | 100 |
| Club memberships / association memberships / team memberships | 100 each |
| Association / competition / season / grade / match format | 1 each |
| Clubs / teams | 5 / 10 |
| Team fixtures | 40: 20 completed, 20 upcoming |
| Finalised team results | 20 |
| Individual rubbers | 160: 120 singles, 40 doubles |
| Rubber participants / sets | 400 / 320 |

Every player has four personal match results and four upcoming team fixtures.
The schedule uses four weeks before/after the first seed date. That date is saved
in an audit marker; rerunning later will **not move existing fixtures**. After
four weeks pass, those originally upcoming dates may be in the past.

Stable IDs plus insert-only operations make reruns safe: existing records are
not overwritten. Players already linked to non-demo profiles are skipped entirely,
so totals may be smaller in a populated database. Unlinked Player records with
matching emails cause a clear error so they can be linked before proceeding.
Names/emails must be unique in the spreadsheet; missing accounts fail before writes.

All writes use one transaction. Any error rolls back that run. `--dry-run` shows
candidate counts before duplicate detection, not necessarily newly inserted counts.
The actual run prints newly inserted counts. The CLI refuses `NODE_ENV=production`.

After seeding, open **http://localhost:5173/demo**, log in using the same spreadsheet
credentials, and the dashboard reads the linked profile from PostgreSQL. Ratings,
memberships, upcoming fixtures, scores and match counts will populate. Features
without schema support (notifications/history/avatars/titles) remain unavailable.
Win percentages remain unknown because the current API does not interpret custom
format rules or infer individual winners from scores.

Optional integration check (writes are rolled back, including its test edits):

```bash
node --env-file=backend/.env --import tsx --test backend/test/dashboard-seed.integration.cjs
```
