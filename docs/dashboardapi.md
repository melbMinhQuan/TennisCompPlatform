# Player Dashboard API

Returns the dashboard for the email that successfully logged in. This endpoint
is planned and is not implemented yet.

## Get dashboard

```http
GET /api/v1/player-dashboard?email=player@example.com
```

Frontend request:

```ts
const url = `${apiUrl}/api/v1/player-dashboard?email=${encodeURIComponent(email)}`
```

Response: HTTP `200`

```json
{
  "data": {
    "profile": {
      "id": "player-uuid",
      "avatarUrl": null,
      "displayName": "Lebron Chris",
      "status": "ACTIVE",
      "dateOfBirth": "2004-04-21",
      "age": 22,
      "gender": "MALE",
      "email": "player@example.com",
      "phone": "+61412345678",
      "primaryClub": "Central Park Tennis Club",
      "primaryAssociation": "Tennis Victoria",
      "teams": ["Central Park A"]
    },
    "utr": {
      "rating": 7.85,
      "category": "ADVANCED",
      "percentileRank": 88,
      "ratingScale": {
        "minimum": 1.0,
        "maximum": 10.0
      },
      "scores": [
        { "label": "Singles UTR Score 1", "value": null },
        { "label": "Singles UTR Score 2", "value": null },
        { "label": "Singles UTR Score 3", "value": null }
      ],
      "historyAvailable": false,
      "lastSyncedAt": "2026-09-16T00:15:00Z"
    },
    "notifications": [
      {
        "id": "notification-uuid",
        "type": "MATCH_DATE_CHANGED",
        "title": "Match Date Changed",
        "message": "Your match in Spring Open has been rescheduled",
        "createdAt": "2026-09-16T01:50:00Z",
        "read": false,
        "details": {
          "previousDate": "2026-09-20",
          "newDate": "2026-09-21"
        }
      }
    ],
    "upcomingMatches": [
      {
        "id": "fixture-uuid",
        "competition": "Spring Open 2026",
        "event": "Men's Singles",
        "round": "Round of 32",
        "scheduledDate": "2026-09-21",
        "scheduledTime": "09:00",
        "location": "Central Park Tennis Centre",
        "opponent": "Jason Miller",
        "status": "RESCHEDULED"
      }
    ],
    "recentMatches": [
      {
        "id": "rubber-uuid",
        "date": "2026-09-10",
        "competition": "Spring Open 2026",
        "round": "Round of 64",
        "opponent": "Jason Miller",
        "outcome": "WIN",
        "score": "6-3 7-6"
      }
    ],
    "careerSummary": {
      "matchesPlayed": 128,
      "matchesWon": 86,
      "winPercentage": 67.2,
      "titlesWon": 12,
      "bestUtrRank": "Top 12%"
    }
  }
}
```

## Frontend notes

- Use `avatarUrl` when available; otherwise show a default avatar.
- Format `createdAt` as relative text such as `10m ago`.
- Derive the month, day, and weekday shown on a match card from
  `scheduledDate`.
- Use notification `type` to choose its icon and colour.
- Notification types shown in the design are `MATCH_DATE_CHANGED`,
  `VENUE_CHANGED`, `DRAW_RELEASED`, and `MATCH_REMINDER`.
- Match status can be `SCHEDULED`, `RESCHEDULED`, `COMPLETED`, or `CANCELLED`.
- A missing value is `null`; a section with no records is `[]`.
- Show an empty-state message when matches or notifications are empty.
- Hide or disable UTR History when `historyAvailable` is `false`.

## Player not found

Response: HTTP `404`

```json
{
  "statusCode": 404,
  "message": "Player not found"
}
```
