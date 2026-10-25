# Coding standards check

How the code compares with [coding_standards.docx](../coding_standards.docx), section by section.
Checked on 24 October 2026. ✅ means the rule is met everywhere it applies; ⚠️ means some code
still differs, and the cell says where.

The backend is checked automatically: `npm run lint --workspace=backend`
([backend/eslint.config.mjs](../backend/eslint.config.mjs)) covers the naming rules (section 1),
`any` (3.1) and the section 8 rules, and CI runs it on every push. The frontend has no linter yet;
its column comes from running the backend's lint rules over `frontend/` and `e2e/` once, and from
searching the code for the rules a linter can't check.

| § | Rule | Backend | Frontend |
| --- | --- | --- | --- |
| 1 | camelCase variables and functions; PascalCase classes, types and components; kebab-case `.ts` and PascalCase `.tsx` files; kebab-case CSS classes; UPPER_SNAKE_CASE environment variables | ✅ (lint) | ✅ |
| 1 | UPPER_SNAKE_CASE constants | ✅ | ⚠️ Some fixed values are camelCase, such as the shared class strings in `components/MatchesUI.tsx` (`pageClass`, `matchCardClass` …), while others, like `CLUB_CARD_CLASS`, are UPPER_SNAKE_CASE |
| 1 | snake_case database columns | ✅ every Prisma field and model maps to a snake_case name (`@map`, `@@map`) | n/a |
| 1.2 | No single-letter names except loop counters | ✅ (lint) | ⚠️ 25 left: `components/standings/StandingsFilters.tsx` (9), `pages/MyClubsPage.tsx` (10), `api/teams.ts` (2), `pages/ClubAdminTeamAddPlayersPage.tsx` (2), `pages/ClubAdminTeamAssignManagerPage.tsx` (2) |
| 2 | Folder structure | ✅ one folder per feature module, as in the example; `prisma/` does the job of `database/` | ⚠️ No `src/` folder. API calls are in `api/` rather than `services/api.ts`, and hooks are in `api/` and `context/` rather than `hooks/` |
| 3.1 | No `any` | ✅ (lint) | ✅ |
| 3.2 | Interfaces for data shapes, in types files | ✅ a `*.types.ts` file per module | ⚠️ Most shapes are declared next to their API call in `api/*.ts`; `types/` holds only `competition.ts` and `season.ts` |
| 3.3 | async/await, not `.then()` | ✅ no `.then()`; the two command-line scripts in `prisma/` end with `main().catch(…)`, because CommonJS has no top-level `await` | ✅ no `.then()`; `api/client.ts` has one `await … .catch()` for a response body that isn't JSON |
| 3.4 | Handle errors; never an empty `catch` | ✅ database work goes through `readOrUnavailable` (`common/data-unavailable.ts`), which turns a failure into a 503; no empty `catch` | ✅ request failures are caught in `api/client.ts` and shown by `useApiData`; no empty `catch` |
| 4.1 | One component per file | n/a | ⚠️ `pages/AssociationAdminJuniorsPage.tsx` also defines `AgeCheck` |
| 4.2 | Function components with hooks, no classes | n/a | ✅ |
| 4.3 | Components under 150 lines | n/a | ⚠️ 8 files are longer: `pages/ClubAdminTeamDetailPage.tsx` (450), `pages/ClubAdminPlayerDetailPage.tsx` (341), `pages/ClubAdminTeamAddPlayersPage.tsx` (272), `pages/ClubAdminAddPlayerPage.tsx` (266), `pages/ClubAdminTeamAssignManagerPage.tsx` (239), `components/ClubAdminLayout.tsx` (206), `src.tsx` (174), `pages/TeamDetailsPage.tsx` (152) |
| 4.4 | All API calls in one place, never `fetch` in a component | n/a | ✅ the only `fetch` is in `api/client.ts` |
| 5.1 | DTOs for all input | ✅ every `@Body` and `@Query` is a DTO, and every `@Param` goes through `ParseUUIDPipe` | n/a |
| 5.2 | Controllers only route; services do the work | ✅ no controller touches the database | n/a |
| 5.3 | Passwords hashed with bcrypt, never returned or logged | ✅ only `auth.service.ts` reads the hash | n/a |
| 6.2 | JSDoc on every service function | ✅ all 79 | ⚠️ 8 functions in `api/` have none: `getDashboard`, `getCompetitions`, `getFixtures`, `getResults`, `getPlayerMemberships`, `getStandings`, `getSupportContacts`, `getTeamDetails` |
| 8 | ESLint and Prettier set up | ⚠️ ESLint yes, Prettier no | ⚠️ neither |
| 8.3 | No unused variables, `===` only, no `console.log` | ✅ (lint) | ⚠️ one unused import, `matchBadgeClass` in `pages/CompetitionsPage.tsx`; no `==` or `console.log` |

**Section 7, commit messages.** 52 of the 116 commits on `develop` start with a type (`feat:`,
`fix:`, `docs:` …). Most recent commits do; history is left as it is, because rewriting it would
break every open branch.

## Already fixed on an open branch

`style/frontend-safe-cleanup` (not merged yet) fixes the `StandingsFilters.tsx` and
`MyClubsPage.tsx` single-letter names, moves `AgeCheck` into its own file, adds the 8 missing JSDoc
comments, removes the unused import and shortens the club administrator pages. Seven files would
still be over 150 lines after it.

## Still to do

1. After that branch is merged, rename the 6 single-letter names it leaves (`api/teams.ts`,
   `ClubAdminTeamAddPlayersPage.tsx`, `ClubAdminTeamAssignManagerPage.tsx`).
2. Add ESLint to the frontend with the backend's rules and run it in CI, so the frontend stays at
   zero the way the backend does.
3. Rename the camelCase fixed values to UPPER_SNAKE_CASE. `MatchesUI.tsx`'s class strings are used
   by almost every page, so do this when no other frontend branch is open.
4. Split the components that are still over 150 lines.
5. Folder structure: either move the frontend to section 2's layout, or change section 2 to match
   the folders the project uses. This is a team decision.
6. Prettier: formatting every file once makes a very large diff. Either do it when no branches are
   open, or take it out of section 8.
