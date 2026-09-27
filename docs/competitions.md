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

## Future API work
When the competition API is complete, `mock-competitions.ts` can be replaced by API data while keeping the page layout and route structure mostly unchanged.
