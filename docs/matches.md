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

- `frontend/components/Matches.tsx`
  - Contains reusable match UI sections such as fixture cards and result rows.

- `frontend/components/MatchesUI.tsx`
  - Stores reusable Tailwind class constants and shared match UI helpers.
  - This file is currently used and should not be deleted.

- `frontend/data/mock-fixtures.ts`
  - Stores temporary hardcoded fixture and result data.
  - The values are copied from the Excel dataset while match APIs are not fully connected.

## Current mock data
The main exported data should be:

```ts
mockFixtures
mockResults
```

## Mock fixture fields
Fixtures currently use display-ready fields such as:

```ts
dateLabel
timeLabel
```

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

## Future API work
When match APIs are complete, `mockFixtures` and `mockResults` can be replaced by API responses while keeping the existing page components and routes.
