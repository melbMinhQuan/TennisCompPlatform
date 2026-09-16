# Player dashboard API

**Proposed contract — these endpoints are not implemented yet.**
The [database gap list](dashboard-data-gaps.md) explains which fields need new data.
The existing [login API](authapi.md) stays unchanged.

## Request rules

- Local base URL: `http://localhost:3000/api/v1`.
- For the local MVP, all `/player-dashboard` requests include the submitted login
  `email` as a query parameter, trimmed/lowercased by the server. Resolve
  `User.email → User.player`; do not guess the player from their name.
- Email is a lookup key, **not proof of login**. It provides no access control.
  Writes below are future contracts and must use trusted caller identity before
  enabling them. No login implementation change is included in this document.
- IDs in examples are placeholders; real IDs are UUIDs.
- Instants use UTC ISO strings. Calendar dates use `YYYY-MM-DD`; local scheduled
  times use `HH:mm` plus `timeZone`. Preserve calendar dates when rendering.
- Missing scalar/object: `null`. Empty list: `[]`. Zero means a known zero.
- A list with `available: false` means the feature/data source is not ready;
  `available: true` with no items means it is ready but has no records.

```ts
const query = new URLSearchParams({ email })
const response = await fetch(`${apiUrl}/api/v1/player-dashboard?${query}`)
```

## First page load

```http
GET /player-dashboard?email=player@example.com
```

One response supplies the profile, UTR, four newest notifications, three upcoming
items, three recent results, career totals and header unread counts. Career totals
are computed across all qualifying results, not just these three preview rows.

Optional `discipline=SINGLES|DOUBLES` (default SINGLES) and `cohortId` select the
rating/ranking context, not the career match totals. Get cohort choices from
`GET /ranking-cohorts`. Without a selected cohort, percentile and best rank are
`null`; the example below assumes a selected singles cohort. A known rating in
another discipline must not be substituted. Legacy undifferentiated ratings use
`discipline:null` as described below.

Example `200` response showing the full future shape; values are illustrative:

```json
{
  "data": {
    "profile": {
      "id": "player-id",
      "avatarUrl": null,
      "displayName": "Lebron Chris",
      "status": "ACTIVE",
      "dateOfBirth": "2004-04-21",
      "age": 22,
      "gender": "MALE",
      "email": "player@example.com",
      "phone": "+61412345678",
      "primaryClub": { "id": "club-id", "name": "Central Park Tennis Club" },
      "primaryAssociation": { "id": "association-id", "name": "Waverley Tennis" },
      "teams": [{ "id": "team-id", "name": "Central Park A" }]
    },
    "utr": {
      "rating": 7.85,
      "discipline": "SINGLES",
      "category": null,
      "percentileRank": 88,
      "cohort": { "id": "cohort-id", "name": "Association singles players" },
      "rankedAt": "2026-09-16T00:00:00Z",
      "recentScores": [
        { "rating": 7.85, "recordedAt": "2026-09-16T00:00:00Z" },
        { "rating": 7.80, "recordedAt": "2026-09-01T00:00:00Z" },
        { "rating": 7.61, "recordedAt": "2026-08-01T00:00:00Z" }
      ],
      "historyAvailable": true,
      "lastSyncedAt": "2026-09-16T00:15:00Z"
    },
    "notifications": {
      "available": true,
      "unreadCount": 1,
      "items": [{
        "id": "notification-id",
        "type": "MATCH_DATE_CHANGED",
        "title": "Match Date Changed",
        "message": "Your Spring Open match has been rescheduled.",
        "createdAt": "2026-09-16T01:50:00Z",
        "readAt": null,
        "details": {
          "previousDate": "2026-09-20",
          "newDate": "2026-09-21",
          "previousTime": "09:00",
          "newTime": "09:00",
          "timeZone": "Australia/Melbourne"
        },
        "target": { "type": "FIXTURE", "id": "fixture-id" }
      }],
      "nextCursor": null,
      "hasMore": false
    },
    "upcomingMatches": {
      "available": true,
      "items": [{
        "id": "fixture-id",
        "kind": "TEAM_FIXTURE",
        "competition": { "id": "competition-id", "name": "Spring Open 2026" },
        "event": null,
        "round": "Round 5",
        "scheduledDate": "2026-09-21",
        "scheduledTime": "09:00",
        "timeZone": "Australia/Melbourne",
        "venue": { "id": "venue-id", "name": "Central Park Tennis Centre", "address": null },
        "opponents": [{ "id": "opponent-team-id", "kind": "TEAM", "name": "Riverside A" }],
        "participationConfirmed": false,
        "status": "SCHEDULED",
        "rescheduled": true
      }],
      "nextCursor": null,
      "hasMore": false
    },
    "recentMatches": {
      "available": true,
      "items": [{
        "id": "rubber-id",
        "kind": "RUBBER",
        "fixtureId": "past-fixture-id",
        "date": "2026-09-10",
        "playedAt": null,
        "competition": { "id": "competition-id", "name": "Spring Open 2026" },
        "event": "Men's Singles",
        "round": "Round 4",
        "opponents": [{ "id": "opponent-player-id", "kind": "PLAYER", "name": "Jason Miller" }],
        "outcome": "WIN",
        "score": "6-3 6-4",
        "sets": [
          { "number": 1, "playerGames": 6, "opponentGames": 3 },
          { "number": 2, "playerGames": 6, "opponentGames": 4 }
        ]
      }],
      "nextCursor": null,
      "hasMore": false
    },
    "careerSummary": {
      "matchesPlayed": 128,
      "matchesWon": 86,
      "matchesLost": 42,
      "unknownOutcomes": 0,
      "winPercentage": 67.2,
      "titlesWon": null,
      "bestUtrRank": null
    },
    "messages": { "available": false, "unreadCount": null }
  }
}
```

## Every dashboard button

All paths below are relative to `/api/v1`; include `email` on `/player-dashboard`
paths. These are full-list/detail endpoints, not filters on the short previews.
Also include `email` on `/matches/:id` requests so the server can select the
player's side when formatting the result. That player must be a participant;
otherwise return `404 RESOURCE_NOT_FOUND`.

| UI action | Request | Result |
| --- | --- | --- |
| View UTR History | `GET /player-dashboard/utr-history?discipline=SINGLES` | Dated rating points, paginated |
| Notifications → View All | `GET /player-dashboard/notifications` | All notifications, newest first |
| Show unread notifications | Same endpoint with `read=false` | Only unread items |
| Open notification | Use its `target.type` and `target.id` | Fixture, match or draw detail (mapping below) |
| Mark notification read | `PATCH /player-dashboard/notifications/:id`, body `{"read":true}` | `200 {data: notification}`; repeated reads preserve the original read time |
| Mark all read | `POST /player-dashboard/notifications/read-all`, body `{"through":"2026-09-16T02:00:00Z"}` | `204`; only notifications created at/before that time |
| Upcoming → View all | `GET /player-dashboard/schedule?scope=upcoming` | All upcoming team fixtures/confirmed individual matches |
| View full schedule | `GET /player-dashboard/schedule?scope=all` | Calendar/list including past and cancelled scheduled items |
| Open scheduled item | `GET /fixtures/:id` for TEAM_FIXTURE; `GET /matches/:id?kind=TOURNAMENT_MATCH` otherwise | Full schedule item, participants, venue and current result |
| Recent Activity → View All | `GET /player-dashboard/results` | All finalised personal results, newest first |
| Open result | `GET /matches/:id?kind=RUBBER` or `kind=TOURNAMENT_MATCH` | The result item plus partners, format and incomplete reason |

Notification targets map as follows: `FIXTURE` → `/fixtures/:id`, `RUBBER` →
`/matches/:id?kind=RUBBER`, `TOURNAMENT_MATCH` → `/matches/:id?kind=TOURNAMENT_MATCH`,
`DRAW` → `/draws/:id`. `target: null` means informational only.

## Pagination and filters

Every list endpoint uses this envelope and the same item fields as its preview:

```json
{
  "data": {
    "available": true,
    "items": [],
    "nextCursor": null,
    "hasMore": false
  }
}
```

- Query: `limit=20` (1–100), `cursor=<opaque cursor>`. Use `nextCursor` unchanged
  for the next page with the same filters. `hasMore` is true exactly when
  `nextCursor` is non-null. Preview cursors also work on the matching full list.
- Notifications also return total `unreadCount`, independent of page or read filter.
- Schedule/results: optional `competitionId`, `from`, `to` (inclusive date-only
  bounds). Schedule defaults to `scope=upcoming`; `scope=all` includes cancelled
  entries. Undated open entries appear last without date filters; they are excluded
  when a date range is requested.
- Schedule sorts by scheduled date/time ascending, then kind/ID; nulls last.
  Upcoming means open, non-cancelled entries today or later, plus undated entries.
  Today's entries remain until completed/cancelled. Use venue time zone; for legacy
  fixtures use a documented application default of `Australia/Melbourne`.
- Results sort by actual played date, falling back to fixture scheduled date,
  descending; nulls last, then kind/ID. Never substitute creation time for played time.
- Notifications/history/messages sort by their timestamp descending, then ID.
  All cursor sorts include a stable ID tie-breaker. Invalid filters/cursors → `400`.

## UTR History and score tiles

```http
GET /player-dashboard/utr-history?email=player@example.com&discipline=SINGLES&from=2026-01-01&to=2026-12-31&limit=20
```

```json
{
  "data": {
    "available": true,
    "discipline": "SINGLES",
    "items": [{
      "id": "snapshot-id",
      "recordedAt": "2026-09-16T00:00:00Z",
      "rating": 7.85,
      "percentileRank": null,
      "cohort": null
    }],
    "nextCursor": null,
    "hasMore": false
  }
}
```

`discipline`: SINGLES or DOUBLES; default SINGLES. Optional `cohortId` selects
percentile context. Without it return null percentile/cohort on history points.
Date bounds are inclusive UTC
calendar days for history. Fetch all pages in the selected range before treating
the chart as complete, then plot oldest first.

The three score tiles use the latest three snapshots for the selected discipline
(singles by default), newest first;
show the rating and recorded date. Fewer than three snapshots means fewer populated
tiles. This interpretation needs product agreement because the design only says
“Score 1/2/3”. `recentScores: []` until snapshots exist.

The current undifferentiated `UtrLink` may populate `rating` with `discipline: null`;
do not label it singles. `category: null` until classification rules are agreed.
`historyAvailable` means history retrieval is implemented, even if it is empty.

`percentileRank` is 0–100 within the returned cohort; the bar uses 0/50/100% ticks.
The mockup's 1/5/10 ticks are not percentile values. Unknown rank/cohort → `null`;
never derive percentile by dividing a rating by 10.

## Notification types

All share `id`, `type`, `title`, `message`, `createdAt`, `readAt`, `target` and `details`.

| Type / icon | `details` |
| --- | --- |
| MATCH_DATE_CHANGED / calendar | `previousDate`, `newDate`, `previousTime`, `newTime`, `timeZone` |
| VENUE_CHANGED / location | `previousVenue`, `newVenue` (venue objects or null) |
| DRAW_RELEASED / trophy | `competitionId`, `drawId` |
| MATCH_REMINDER / bell | `scheduledDate`, `scheduledTime`, `timeZone` |

Render `createdAt` as “10m ago”; display old → new dates for date changes. Read
state is `readAt !== null`. Future types fall back to a generic icon/title/message.
Unread count is `null` when notifications are unavailable, not a false zero.

## Match and career display rules

- `kind`: TEAM_FIXTURE, RUBBER, TOURNAMENT_MATCH. A team fixture is a schedule
  item, not one played match for each team member. RUBBER is an individual match
  within a team fixture; individual tournament matches need new models.
- Avoid duplicate upcoming entries: show the team fixture until a separate
  confirmed personal schedule is available; then replace that fixture card with
  the player's individual scheduled item(s).
- `opponents` supports two people for doubles or one opposing team. Result detail
  also returns `partners: [{id, name}]`, `format: {id, name} | null`, and
  `incompleteReason: string | null`. Points not stored in the DB must not be invented.
- `status`: SCHEDULED, COMPLETED, CANCELLED; proposed future POSTPONED.
  `rescheduled` is a separate boolean, `null` until change history is available.
- `outcome`: WIN, LOSS, DRAW, NO_RESULT, or `null` when undecidable. Retirements and
  walkovers require an explicit winner; do not infer one from partial games.
- `score` is a server-formatted string from the player's perspective; prefix with
  W/L in the frontend. `sets` uses the same perspective. Unknown score → `null`.
- `event`, `round`, venue, time and actual played time can be `null`. Show TBD for
  unknown time. Do not convert “Round 5” to “Round of 32”. Event labels must be
  derived from known event/grade metadata, not assumed from a player's gender.
- Career scope: all finalised personal matches in this platform. Count each once.
  Wins/losses/draws/NO_RESULT count toward `matchesPlayed`; NO_RESULT is not a win.
  `unknownOutcomes` counts unresolved interpretations. `winPercentage` = wins /
  matchesPlayed × 100, rounded to one decimal; return `null` if zero played or any
  unknown outcome remains. Exclude DRAFT/PENDING_CONFIRMATION/UNDER_CORRECTION.
- `titlesWon` is `null` until awards exist; zero only when confirmed no awards.
- When available, `bestUtrRank` is `{percentileRank:88, cohort:{id,name},
  discipline:"SINGLES", recordedAt:"..."}`. Display “Top 12%” and its cohort.
  This is the best recorded percentile within the selected cohort/discipline,
  not a global ranking claim. No history → `null`.

## Header and sidebar destinations

Navigation opens frontend pages; these endpoints supply their data. All are
proposed. Collections use the pagination envelope above; details use `{data: ...}`.

| Control | API / frontend behavior | Minimum data |
| --- | --- | --- |
| Logo / Home / Profile | Load `/player-dashboard` | Dashboard response above; logo is a frontend asset |
| Competitions | `GET /competitions`, `GET /competitions/:id` | List: `{id,name,type,status}`; detail adds `seasons:[{id,year,seasonType}]` |
| Clubs | `GET /clubs`, `GET /clubs/:id` | List: `{id,name,address}`; detail adds `{association:{id,name},teams:[{id,name}]}` |
| Fixtures | `GET /fixtures?from=...&to=...&competitionId=...`, `GET /fixtures/:id` | Schedule shape above; detail adds home/away teams and current result or null |
| Search events | `GET /search?q=spring&limit=20&cursor=...` | Items: `{id,type:"COMPETITION",name}` today; future `type:"EVENT"` routes to `/events/:id` |
| Rankings | `GET /ranking-cohorts`; then `GET /rankings?cohortId=...&discipline=SINGLES` | Cohort items: `{id,name}`; ranking items: `{rank,player:{id,name},rating,percentileRank}`; envelope adds `cohort`, `discipline`, `asOf` |
| Teams | `GET /player-dashboard/teams`, `GET /teams/:id` | List: `{id,name,club:{id,name},section:{id,name}}`; detail adds public roster `{id,name}` |
| Matches | Schedule/results endpoints above | Tabs for upcoming schedule and personal result history |
| Messages / header speech bubble | `GET /player-dashboard/conversations` | Items: `{id,participants:[{id,name}],lastMessage:{text,sentAt},unreadCount}` |
| Open conversation | `GET /player-dashboard/conversations/:id/messages` | Paginated `{id,sender:{id,name},text,sentAt,readAt}` |
| Send message | `POST /player-dashboard/conversations/:id/messages`, body `{text}` | `201 {data: message}`; requires conversation membership |
| Mark conversation read | `PATCH /player-dashboard/conversations/:id/read`, body `{throughMessageId}` | `204`; mark received messages through that message |
| Settings / account dropdown | `GET /player-dashboard/settings`; `PATCH` same path with changed fields | `{data:{available:true,timeZone:"Australia/Melbourne",emailNotifications:true}}` |
| Help | Open frontend help page | Static content; no API required |
| Log out | Clear locally saved email/dashboard and return to login | Existing login has no server session/logout endpoint |

Lists `/competitions`, `/clubs`, `/ranking-cohorts` and `/player-dashboard/teams`
sort name then ID; search requires
2–100 characters and searches competition names now, future event names later,
sorting name/type/ID. Fixture filters/sorts match the schedule rules. Conversations
sort last message time then ID, newest first; an empty conversation has
`lastMessage: null`. Messages require non-blank text, maximum 2,000 characters.

Rankings require a defined cohort, default discipline SINGLES, and sort rank then
player ID; ties share rank. A non-existent cohort ID returns `400 INVALID_QUERY`.
Until ranking data exists return `available:false`,
empty items and null `asOf`. Public lists/details must not expose player emails,
phone numbers or birth dates. Draw detail `/draws/:id` returns competition/event
references, `publishedAt`, and `rounds:[{label,matches}]` using tournament schedule
items. Event detail `/events/:id` returns `{id,name,competition,discipline,drawId}`.
Fixture detail includes `homeTeam`/`awayTeam` as `{id,name}` and
`result:{homeRubbers,awayRubbers,status} | null`; these totals are team results,
not the individual score shape used by `/matches/:id`.
Unpublished draws are not returned to public callers.

No API invents a primary team: the profile returns every active team. Header name
comes from `profile.displayName`; message red dot means `messages.unreadCount > 0`.
Settings should show unavailable until preferences exist. Message/settings/read-state
writes require an authenticated owner; another player's email must not grant access.

## Empty states and errors

- Avatar missing → initials/default image. Unavailable metric → “Not available”.
- `available:false` → “Coming soon”; available empty list → “No records yet”.
- Show “No notifications” only when that feature is available and empty.
- “View all” starts the full-list request, and “Load more” uses its cursor. UTR
  History is disabled until `historyAvailable:true`; future sidebar features
  display their unavailable state. Loading/error state is separate from empty data.
- Backend outage → an error, not empty successful data. Per-card error handling
  can be added later; this dashboard aggregate returns `503` if its query fails.

```json
{
  "statusCode": 404,
  "code": "PLAYER_PROFILE_NOT_LINKED",
  "message": "This account does not have a linked player profile yet."
}
```

Errors: `400 INVALID_QUERY`, `404 USER_NOT_FOUND`, `404 PLAYER_PROFILE_NOT_LINKED`,
`404 RESOURCE_NOT_FOUND`, `503 DATA_UNAVAILABLE`. Future protected endpoints also
use `401 UNAUTHENTICATED` and `403 FORBIDDEN`; writes to unavailable features return
`501 FEATURE_NOT_AVAILABLE`. Error responses share the shape above. Login retains
its existing response format in `authapi.md`.
