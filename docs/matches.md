# Matches Frontend

## Purpose
The matches frontend shows upcoming team fixtures and finalised match history for the current player.

## Main files
- `frontend/pages/MatchesPage.tsx`
  - Main matches page.
  - Contains the `Upcoming` and `History` views.
  - Uses shared match components and mock data.

- `frontend/pages/MatchFixturePage.tsx`
  - Displays the details of one upcoming fixture.
  - Shows the teams, round, date, time, venue, participation, and competition information.

- `frontend/pages/MatchScorecardPage.tsx`
  - Displays a finalised result and scorecard.
  - Shows player/opponent names and set scores.

- `frontend/components/matches/`
  - `UpcomingFixtureCard.tsx`, `ResultCard.tsx` and `ScorecardTable.tsx`: the cards and table used by the pages above.

- `frontend/components/MatchesUI.tsx`
  - Shared Tailwind class constants for every player page (page title, cards, buttons, tabs).
  - `MatchLoadState.tsx` and `MatchNotFound.tsx` are the shared loading/error and not-found cards.

- `frontend/utils/date-helpers.ts`
  - Formats raw dates and times for display.

- `frontend/data/mock-fixtures.ts`
  - Stores temporary hardcoded fixture and result data.
  - The values are copied from the Excel dataset while match APIs are not fully connected.

## Current mock data
The main exported data should be:

```ts
mockFixtures
mockResults
```

## Sample player
The data is Chloe Cooper (PLR005) from `competition_data.xlsx`, the same sample player as
My Clubs, Standings and Help. Her current team is Mount Waverley A (TEAM018).

## Mock fixture fields
Fixtures store raw values, the same as the API will send:

```ts
date: "2026-09-27"   // YYYY-MM-DD, local to the venue; null when postponed with no new date
time: "13:00"        // HH:mm, local to the venue
status: "Scheduled" | "Postponed" | "Completed"
```

`utils/date-helpers.ts` formats them for display (`formatFixtureDate`, `formatTime`,
`formatResultDate`, `dateParts`), e.g. "SUN 27 SEP · 1:00 PM". A postponed fixture
with no date shows "Date to be confirmed".

## Mock result fields
Results use fields such as:

```ts
result: "W" | "L"
sets: [
  { playerGames: 6, opponentGames: 3 },
  { playerGames: 6, opponentGames: 0 },
]
```

The score shown in the UI is generated from `sets`.

## Routing
```text
/dashboard/matches
/dashboard/matches/:fixtureId
/dashboard/matches/scorecards/:resultId
```

## Page flow
```text
My matches
   ├── Upcoming
   │      ↓
   │   Fixture details
   │
   └── History
          ↓
       Scorecard
```

## API handoff
Pages load data through `frontend/api/matches.ts` (`getFixtures`, `getResults`) and the
shared `useApiData` hook, which shows loading and error/retry states. The types
`MatchFixture` and `MatchResult` in that file are the contract.

- Set `VITE_FIXTURES_API_URL` and `VITE_RESULTS_API_URL` to the endpoints; each returns `{ data: [...] }`.
- Without them, the pages use `mock-fixtures.ts`. With them, API errors show an error and
  "Try again"; they never fall back to the hardcoded data.
- The server works out the logged-in player. Map a different backend shape inside `matches.ts`.

**Logged-in players never see sample data.** Sample data (Chloe Cooper) is only a logged-out preview. If a player is logged in and this page's endpoint is not set yet, the page shows "not available yet" instead, so a real player never sees someone else's data as their own.
