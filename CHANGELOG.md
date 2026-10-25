# Changelog

What changed in each release, sprint by sprint. Each entry names the user story it delivers (see
[README → Features by sprint](README.md#features-by-sprint)) and the branch and pull request it came
from. Pull requests stay on GitHub after their branch is deleted, and GitHub can restore a deleted
branch from its pull request. Work committed straight to `main` or `develop` is listed by commit.

## Unreleased: handover

Work after Sprint 2, going into the final release.

- Repository clean-up: unused files and the `ts-node` dependency removed, frontend single-letter
  names renamed (coding standard 1.2): `chore/repo-cleanup`
- Handover documentation: README rebuilt for handover, `LICENSE`, this changelog,
  `docs/database.md` (entity relationship diagrams) and `docs/coding-standards.md`: `chore/repo-cleanup`
- Frontend coding-standards compliance: `style/frontend-safe-cleanup` (#41, open)

## v2.0.0: Sprint 2, Club Administration (5–25 October 2026)

Tag `v2.0.0` marks commit `6f9e556` on `main` (24 October 2026).

### Features

- **US-18** A club administrator sees and changes only their own club:
  - club administrator accounts and one role per user: `feature/club-admin-database` (#19)
  - own-club visibility in the backend: `feature/club-admin-backend` (#21)
  - the right home page for each role after login: `feature/login-role-routing` (#26)
  - club administrator layout, Players and Teams pages: `feature/dashboard-clubAdmin` (#25, #29)
  - club dashboard: `feature/club-admin-dashboard` (#33)
  - club and administrator name taken from login: `fix/club-admin-club-and-stale-fixtures` (#34),
    `feature/club-admin-header-from-login` (#35)
  - every club administrator page connected to the backend: `feature/club-admin-connect` (#37)
- **US-19** Search the player registry before creating a new player: `feature/club-admin-team-writes`
  (#30); matching incomplete names and finding profiles registered twice: commit `15c7f92`
- **US-20** Create a team in a season open for entries, with a name unique in that season: unique
  names in `feature/club-admin-database` (#19), team creation in `feature/club-admin-team-writes` (#30)
- **US-21** Only active, eligible club members join a squad: `feature/club-admin-team-writes` (#30)
- **US-45** Assign, change or remove a team manager: `feature/club-admin-team-writes` (#30)
- **Manage membership** Add a player to the club, or bring back a former member:
  `feature/club-admin-team-writes` (#30)
- **US-22** Club administrator notifications and read state: `feature/club-admin-notifications` (#31)
- Fixtures & Results, view only: `feature/club-admin-fixtures` (#32)
- Help & Support contacts: club administrator contacts in `feature/club-admin-support-contacts` (#27);
  every current team in a player's contacts in `feature/support-contacts-all-teams` (#38) and
  `feature/support-contacts-teams-frontend` (#39)
- Junior privacy, readable Player and Club IDs, and the association administrator's juniors page:
  `feature/seed-readable-ids` (commit `345e69d`)
- Deployment to Azure on every push to `main`: `feature/azure-deploy` (#22); deployment guide:
  commit `4707ad6`
- Testing: CI tests every stage up to the live site (commit `182350c`); club administrator tests
  (commit `78b7fd3`); `TestingPlan.xlsx` checked against the code in CI: `feature/seed-readable-ids`
  (commit `e5fa701`); Sprint 2 testing plan (commit `e78a6f9`, released in #40)
- Coding standards: backend aligned, ESLint in CI: `feature/coding-standards` (#42)

### Bug fixes

- **US-30** Past fixtures no longer listed as upcoming: `fix/club-admin-club-and-stale-fixtures` (#34),
  `feature/dashboard-clubAdmin` (#36)
- **US-25** Inactive accounts refused at login, login input checked: `feature/club-admin-connect` (#37)
- **US-26** Sprint 1 client feedback: UTR labelled as Universal Tennis and kept apart from standings
  (commits `4a476c9`, `433e0c9`)
- Database: player email column dropped and `docker-compose.yml` committed: `feature/debug` (#20);
  profile relation renamed to `User.profile`: `feature/user-profile-relation` (#28)

## v1.0.0: Sprint 1, Player (7 September – 4 October 2026)

Tag `v1.0.0` marks commit `e7b8b0f` on `main` (1 October 2026). The client approved the video demo
and the move to Sprint 2.

### Features

- Project set-up: React, NestJS and Tailwind (commit `b416423`); backend connected to PostgreSQL
  through Prisma (commit `65d7289`)
- **US-25** Log in: 100 test accounts with hashed passwords (commit `614e62c`); login endpoint:
  `feature/backend-login` (#2); login page: `feature/frontend-login` (#11)
- **US-31, US-32** One central player record across clubs and competitions: database schema
  (commit `b8ad736`) and `feature/db-schema` (#1); competition data, dashboard tables and the seed:
  `feature/db-schema` (#13, #14)
- **US-26, US-27, US-29, US-30** Dashboard API: `feature/dashboard-api` (#5); profile, UTR rating,
  recent activity and upcoming competitions: `feature/dashboard-page` (#12)
- **US-28, US-29, US-30** My Clubs, competitions and matches pages, standings, team details and
  Help & Support: `feature/dashboard-page` (#12)
- Every player page connected to the backend, notifications and the UTR API scaffold:
  `feature/dashboard-api` (#15)
- Tests: unit and integration tests, test plan and CI pipeline: `feature/dashboard-api` (#16);
  end-to-end tests: `feature/dashboard-api` (#17)
- API contracts for the frontend: `doc` (#3, #4)

### Bug fixes

- Test data: set scores, match times, finals and email domains corrected: `feature/db-schema` (#13);
  seed follows a regenerated workbook: `feature/db-schema` (#14); repeated test accounts removed
  (commit `e7b8b0f`)
