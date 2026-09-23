# My Clubs & Association: frontend integration

Uses the existing `getDashboard(email)` helper and `GET /api/v1/player-dashboard?email=...`. No backend, schema or database changes are included.

## Displayed now

- Player name and database Player ID.
- Header initials generated from `profile.displayName`.
- Primary club and primary association, when supplied.
- Active team names, shown separately because their club relationships are not in the response.
- Loading, login-required, request error/retry and missing-data states.

A null primary club does not prove that the player has no club memberships. The page says "No primary club recorded" rather than claiming zero clubs. It does not invent membership counts, dates, or relationships.

## Information needed from the backend team

The Figma clubs screen and player stories need these fields in a future agreed API response:

- All player club memberships, with club ID/name, primary flag, membership status and start date.
- All explicit player association memberships, with association ID/name, primary flag and membership status.
- Each club's association and available contact details.
- Team-to-club links, competition and section names, and season/current status.
- Authenticated current-user identity for production use. 

No new endpoint is required by this frontend change; the backend team should decide the contract. Until it exists, the page marks these details as unavailable. It does not infer association membership from a club, or assign every team to the primary club.

## Current login flow

Successful login stores the submitted email in React memory. The existing dashboard API supplies the header name and clubs page data. Logout clears identity; changing identity aborts pending requests. Refresh requires login again. The profile page remains unchanged.

This is the team's existing email-based local-demo flow, not a secure production session. The backend's existing production guard remains unchanged.

## Validation

Run `npm run build --workspace=frontend`. Backend changes and the added memberships endpoint tests have been removed. No live database mutations were made.
