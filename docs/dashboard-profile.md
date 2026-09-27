# Dashboard Frontend

## Purpose
The dashboard combines API-connected player information with temporary hardcoded match data.

## Main file
- `frontend/pages/DashboardPage.tsx`

## Main components
- `PlayerProfile.tsx`
- `PlayerRatings.tsx`
- `NotificationPanel.tsx`
- `RecentActivity.tsx`
- `UpcomingCompetition.tsx`

## Current data sources
The dashboard currently uses a mixed API and mock-data approach.

### Player profile, ratings and career summary
When a player is logged in and API data is available, the dashboard uses the API for:
- Player profile
- Player ratings
- Career summary

The Profile page is also accessible without logging in.

When no logged-in API data is available, temporary fallback data is displayed so the Profile page can still be viewed during frontend development.

### Match-related mock data
These parts currently use the same temporary Excel-based data as the Matches pages:
- Recent Activity → `mockResults`
- Upcoming Competition → `mockFixtures`

This keeps the Dashboard and Matches pages consistent while the backend match APIs are still incomplete.

## Data flow

```text
DashboardPage.tsx
│
├── PlayerProfile
│      ↓
│   API when logged in
│   fallback mock data when logged out
│
├── PlayerRatings
│      ↓
│   API when available
│   fallback rating when logged out
│
├── Career Summary
│      ↓
│   API when available
│   fallback summary when logged out
│
├── RecentActivity
│      ↓
│   mockResults
│
└── UpcomingCompetition
       ↓
    mockFixtures
```

## Recent Activity
`RecentActivity.tsx` displays:
- Match date
- Competition name
- Discipline
- Round
- Opponent(s)
- Win/loss badge
- Score

The win/loss badge is based on:

```ts
result: "W" | "L"
```

Example:

```text
W, 6–3 6–0
```

A win is shown with a green badge and a loss with a red badge.

## Upcoming Competition
`UpcomingCompetition.tsx` displays the upcoming fixtures from `mockFixtures`.

Each item can link to:

```text
/dashboard/matches/:fixtureId
```

so the dashboard and matches pages share the same fixture data.

## Future API work
When the Recent Activity and Upcoming Matches APIs are ready, the mock arrays can be replaced with API responses without redesigning the dashboard components.

## Logged-out profile access
The Profile dashboard can be viewed without logging in.

When the user is not logged in:
- A temporary mock player profile is shown.
- A fallback player rating is shown.
- A fallback career summary is shown.
- Recent Activity still uses `mockResults`.
- Upcoming Competition still uses `mockFixtures`.

When the user logs in, available API data replaces the profile-related fallback values.