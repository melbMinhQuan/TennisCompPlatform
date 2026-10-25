# Competitions Frontend

## Purpose
The competition frontend shows the competitions that the current player is registered in and allows the player to open a detailed competition page.

## Main files
- `frontend/pages/CompetitionsPage.tsx`
  - Displays the player's current competition entries.
  - Shows competition name, club, team, section, season, and format.
  - Links to the competition detail page.

- `frontend/pages/CompetitionDetailsPage.tsx`
  - Displays one competition entry in more detail.
  - Shows the represented club, team, player information, season, format, and next fixture.
  - Links to the related fixture page when a next fixture exists.

- `frontend/data/mock-competitions.ts`
  - Stores temporary hardcoded competition data.
  - The values are copied from the project 'Competition' Excel data while the competition API is not fully connected.

- `frontend/types/competition.ts`
  - Defines the TypeScript structure used by competition mock data.
  - Includes the competition entry, player, and optional next fixture information.

## Current data source
Competition pages currently use temporary mock data based on the Excel competition dataset.

Example flow:

```text
competition_data.xlsx
        ↓
mock-competitions.ts
        ↓
CompetitionsPage.tsx
        ↓
CompetitionDetailsPage.tsx
```

## Routing
```text
/dashboard/competitions
/dashboard/competitions/:entryId
```

## Important behaviour
- Only active competition entries should be shown in the current-season list.
- Completed competitions may have `nextFixture: null`.
- The detail page must check whether a next fixture exists before rendering fixture information.
- The player name and player ID should come from the competition data instead of being hardcoded in the page.

## Sample player
Chloe Cooper (PLR005) from `competition_data.xlsx`: Mount Waverley A (Weekend Senior,
Winter 2026, current), Syndal A (Night Tennis, Autumn 2026) and Glen Waverley A
(Weekend Senior, Winter 2025). Night Tennis uses format MF13, so it shows
"Team singles & doubles" (2 singles + 1 doubles).

## API handoff
Both pages load data through `getCompetitions` in `frontend/api/matches.ts` and the shared
`useApiData` hook (loading and error/retry states). When a player is logged in they call
`GET /api/v1/player/competitions?email=`, which returns `{ data: CompetitionEntry[] }` (type in
`frontend/types/competition.ts`): one entry per team the player is actively registered in.
`nextFixture` is the team's next SCHEDULED or POSTPONED fixture dated today or later, or null;
`nextFixture.date` is YYYY-MM-DD and `nextFixture.time` is HH:mm. Finals have `round: null` and a
`roundLabel` such as "Grand Final". Logged out, the pages use `mock-competitions.ts`.

**Logged-in players never see sample data.** Sample data (Chloe Cooper) is only a logged-out preview. A logged-in player always gets their own data from the backend; if that request fails the page shows an error and "Try again", never the sample.
