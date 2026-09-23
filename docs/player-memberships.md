# My Clubs & Association: frontend integration

Uses the existing `getDashboard(email)` helper and `GET /api/v1/player-dashboard?email=...`. No backend, schema or database changes are included.

## Displayed now

- Player name and database Player ID.
- Header initials generated from `profile.displayName`.
- Primary club and primary association, when supplied.
- Active team names, shown separately because their club relationships are not in the response.
- Loading, login-required, request error/retry and missing-data states.

A null primary club does not prove that the player has no club memberships. The page says "No primary club recorded" rather than claiming zero clubs. It does not invent membership counts, dates, or relationships.

## Chosen redesign (Figma, final)

Direction chosen: association-first grouping (a flattened version of the two directions mocked up earlier — see [the exploration artifact](https://claude.ai/artifact/BjtSbAVo8ggCC4aAsrKjk7)). Confirmed for both desktop and mobile. Layout, top to bottom:

- Identity + summary card: player name, `Player · primary association: {name}`, and three counts — **Associations**, **Clubs**, **Teams** — in that order.
- One section per association membership: association name, `Member since {Month Year} · {status} membership`, and a `PRIMARY ASSOCIATION` / `ADDITIONAL ASSOCIATION` badge.
- Under each association, one full-width card per club membership in that association: club name, `Member since {Month Year} · {status} membership`, `PRIMARY CLUB` / `ADDITIONAL CLUB` badge, a `MY TEAMS` label with up to two team chips (`{team name} · {competition/season name}`), and a `View Teams →` link.
- An association with no clubs shows an empty-state card: "No clubs recorded under this association yet."
- Mobile is the same structure, single column, no left-border nesting — matches desktop exactly, just narrower.

Open question, not yet decided: what `View Teams →` links to. The mockup shows at most 2 team chips per club, so if a club/season has more than 2 teams there needs to be a real destination (a full roster view scoped to that club membership, or an expand-in-place) — this needs a product decision before it's built, it isn't just a display-more-of-the-same-array case.

## Information needed from the backend team

The Figma clubs screens and the player user stories ("be associated with one or more than one club/association", "represent different clubs in different competitions") need the full membership lists, not just the primary one. This turns out to be a small change, not a new feature:

`DashboardService.dashboard()` (`backend/src/dashboard/dashboard.service.ts`) already loads the full `clubMemberships` and `associationMemberships` arrays for the player via Prisma (`playerInclude`, same file), including `isPrimary`, `status`, and `startDate`/`endDate` on each row. It then narrows them down to a single primary club/association before building the response:

```ts
const club = player.clubMemberships.find(m => m.isPrimary)?.club
const association = player.associationMemberships.find(m => m.isPrimary)?.association
```

and flattens `teamPlayers` to bare `{id, name}` references, dropping each team's club.

What's actually needed:

1. Return the full `clubMemberships[]` array in the DTO — club ID/name, `isPrimary`, `status`, `startDate`/`endDate` — instead of collapsing to one `primaryClub`. The `Associations`/`Clubs`/`Teams` counts on the identity card are `.length` of these arrays on the frontend; no separate count field needed.
2. Return the full `associationMemberships[]` array the same way, instead of one `primaryAssociation`.
3. Nest each club membership under its own association (`club.associationId`), not just the player's primary association — add `club: { include: { association: true } }` to `playerInclude` so each club membership can carry its own association's name and contact details. This is what lets the page group clubs under the right association section.
4. Add `team: { include: { section: { include: { season: { include: { competition: true } } } } } }` to the `teamPlayers` include, and return each team's club ID plus a competition/season label (`Summer Pennant 2025/26`, etc.) for the `{team name} · {competition/season name}` chip text, so a team can be shown under the right club instead of in an unlinked list.
5. Authenticated current-user identity for production use — separate, larger item, unchanged from before.

No schema or migration changes are required for 1–4: the tables (`ClubMembership`, `AssociationMembership`, `Team`, `SectionGrade`, `Season`, `Competition`) and their relations already exist in `backend/prisma/schema.prisma`; the club/association/team data is already queried, just narrowed away in the service. This is a DTO shape + two extra `include` joins, not a new endpoint.

One data nuance the redesign surfaced: `AssociationMembership` is independent of `ClubMembership` — a player can hold an explicit association membership with no club of theirs mapped to it (e.g. joined the association directly). The frontend should not assume every association a player belongs to has a corresponding club, or infer association membership purely from a club's `associationId`.

Until the DTO ships, the page marks these details as unavailable. It does not infer association membership from a club, or assign every team to the primary club.

## Current login flow

Successful login stores the submitted email in React memory. The existing dashboard API supplies the header name and clubs page data. Logout clears identity; changing identity aborts pending requests. Refresh requires login again. The profile page remains unchanged.

This is the team's existing email-based local-demo flow, not a secure production session. The backend's existing production guard remains unchanged.

## Validation

Run `npm run build --workspace=frontend`. Backend changes and the added memberships endpoint tests have been removed. No live database mutations were made.
