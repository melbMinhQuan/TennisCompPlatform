# Club admin Help & Support

Route: `/club-admin/support`. Help page for club administrators: static help content, and contacts from the backend.
It reuses the player Help page components (topics, search, answers, contact cards), so colours,
layout and wording style match Sprint 1.

## Content
- `frontend/data/club-admin-support-content.ts`: 6 topics and 19 answers, written from User Stories
  Model v2.1, the Sprint 2 plan, the Sprint 1 client review and the Sprint 2 Figma screens
  (Add a player: 1 Search → 2 Choose → 3 Done; Teams → Create team → Add players; Team manager).
- Rules it follows: search before creating a player (one Player ID), memberships become
  **Inactive** (database `INACTIVE` + end date), juniors need a parent or guardian email,
  dates of birth and contact details are never shown in search results, club admins only see
  their own club (US-18), results are view-only (corrections and disputes go to the
  Association Administrator, US-23/US-24), UTR comes from Universal Tennis.
- `ClubAdminQuickGuide` shows the three jobs as click paths.

## Contacts
`frontend/api/club-admin-support.ts` loads `GET /api/v1/club-admin/support-contacts` →
`{ data: ClubAdminSupportContactsData }` for the signed-in club administrator's own club only
(US-18). For Margaret Hayes (Glen Waverley) the seeded database gives (E2E-015):
- Glen Waverley Tennis Club: phone, email, address (what players see).
- Waverley Tennis: phone and email, administrator Raj Mitchell, records secretary Mia Coleman.
  Volunteers are named only, no personal phone or email.

A failed request says the contacts couldn't be loaded, with a retry button; the general advice
on the page still shows. It never falls back to sample contacts.
