# My Clubs & Association: frontend integration

Uses the existing `getDashboard(email)` helper and `GET /api/v1/player-dashboard?email=...`. No backend, schema or database changes are included.

## Displayed now

- Player name and database Player ID.
- Header initials generated from `profile.displayName`.
- Primary club and primary association, when supplied.
- Active team names, shown separately because their club relationships are not in the response.
- Loading, login-required, request error/retry and missing-data states.

A null primary club does not prove that the player has no club memberships. The page says "No primary club recorded" rather than claiming zero clubs. It does not invent membership counts, dates, or relationships.

## Planned redesign

Two layout directions were mocked up against the full-membership-list data described below: [Option A, club-centric](https://claude.ai/artifact/BjtSbAVo8ggCC4aAsrKjk7) (one card per club membership, teams nested under their club, associations summarized below) and Option B, association-first (associations as the top-level grouping, clubs nested underneath, teams nested under their club). Direction not yet chosen; implementation is blocked on the backend DTO change below either way.

## Information needed from the backend team

The Figma clubs screens and the player user stories ("be associated with one or more than one club/association", "represent different clubs in different competitions") need the full membership lists, not just the primary one. This turns out to be a small change, not a new feature:

`DashboardService.dashboard()` (`backend/src/dashboard/dashboard.service.ts`) already loads the full `clubMemberships` and `associationMemberships` arrays for the player via Prisma (`playerInclude`, same file), including `isPrimary`, `status`, and `startDate`/`endDate` on each row. It then narrows them down to a single primary club/association before building the response:

```ts
const club = player.clubMemberships.find(m => m.isPrimary)?.club
const association = player.associationMemberships.find(m => m.isPrimary)?.association
```

and flattens `teamPlayers` to bare `{id, name}` references, dropping each team's club.

What's actually needed:

1. Return the full `clubMemberships[]` array in the DTO — club ID/name, `isPrimary`, `status`, `startDate`/`endDate` — instead of collapsing to one `primaryClub`.
2. Return the full `associationMemberships[]` array the same way, instead of one `primaryAssociation`.
3. Add `club: { include: { association: true } }` to `playerInclude` so each club membership can show its own association's name (not just the player's primary association) and contact details.
4. Add `team: { include: { section: { include: { season: { include: { competition: true } } } } } }` to the `teamPlayers` include, and return each team's club ID plus its competition/season/section name, so a team can be shown under the right club instead of in an unlinked list.
5. Authenticated current-user identity for production use — separate, larger item, unchanged from before.

No schema or migration changes are required for 1–4: the tables (`ClubMembership`, `AssociationMembership`, `Team`, `SectionGrade`, `Season`, `Competition`) and their relations already exist in `backend/prisma/schema.prisma`; the club/association/team data is already queried, just narrowed away in the service. This is a DTO shape + two extra `include` joins, not a new endpoint.

One data nuance the redesign surfaced: `AssociationMembership` is independent of `ClubMembership` — a player can hold an explicit association membership with no club of theirs mapped to it (e.g. joined the association directly). The frontend should not assume every association a player belongs to has a corresponding club, or infer association membership purely from a club's `associationId`.

Until the DTO ships, the page marks these details as unavailable. It does not infer association membership from a club, or assign every team to the primary club.

## Current login flow

Successful login stores the submitted email in React memory. The existing dashboard API supplies the header name and clubs page data. Logout clears identity; changing identity aborts pending requests. Refresh requires login again. The profile page remains unchanged.

This is the team's existing email-based local-demo flow, not a secure production session. The backend's existing production guard remains unchanged.

## Validation

Run `npm run build --workspace=frontend`. Backend changes and the added memberships endpoint tests have been removed. No live database mutations were made.
