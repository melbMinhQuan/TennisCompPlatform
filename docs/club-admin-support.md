# Club admin Help & Support

Route: `/club-admin/support`. Display-only (hardcoded) Sprint 2 page for club administrators.
It reuses the player Help page components (topics, search, answers, contact cards), so colours,
layout and wording style match Sprint 1.

## Content
- `frontend/data/club-admin-support-content.ts`: 6 topics and 18 answers, written from User Stories
  Model v2.1, the Sprint 2 plan, the Sprint 1 client review and the Sprint 2 Figma screens
  (Add a player: 1 Search → 2 Choose → 3 Done; Teams → Create team → Add players; Team manager).
- Rules it follows: search before creating a player (one Player ID), memberships become
  **Inactive** (database `INACTIVE` + end date), juniors need a parent or guardian email,
  dates of birth and contact details are never shown in search results, club admins only see
  their own club (US-18), results are view-only (corrections and disputes go to the
  Association Administrator, US-23/US-24), UTR comes from Universal Tennis.
- `ClubAdminQuickGuide` shows the three jobs as click paths.

## Contacts (hardcoded until the API exists)
`frontend/api/club-admin-support.ts` returns `frontend/data/mock-club-admin-support-contacts.ts`,
taken from `competition_data.xlsx` for Ethan Wright (UR003, CLUB_ADMIN for CLB01):
- Club CLB01 Glen Waverley Tennis Club: phone, email, address (what players see).
- Association ASSOC01 Waverley Tennis: phone and email, administrator Raj Mitchell (UR001),
  records secretary Mia Coleman (UR002). Volunteers are named only, no personal phone or email.

## For the API team
Planned endpoint: `GET /api/v1/clubs/:clubId/support-contacts` → `{ data: ClubAdminSupportContactsData }`
(type in `frontend/api/club-admin-support.ts`), for the logged-in club administrator's own club only.
Connect it after login returns the role and clubId (US-18). Errors must not fall back to the sample.
