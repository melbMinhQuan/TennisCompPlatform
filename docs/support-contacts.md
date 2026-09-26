# Help & Support: "Who should I contact?"

Component: frontend/components/SupportContacts.tsx, shown on /dashboard/support.

Based on the functional requirement "Club information stored and shown… so teams
know where to go and who to call" and the roles in competition_data.xlsx
(TEAM_MANAGER, CLUB_ADMIN, RECORDS_SECRETARY). Three cards:

1. Your team: current-season team, its team manager (name only) and the team's
   club phone/email. For selection, availability and match-day arrangements.
2. Your primary club: club administrator (name only) and the club's phone,
   email and address. For profile details, login access and memberships; the
   primary club looks after the player record.
3. Association: records secretary (name only) and the association's phone and
   email. For rules, eligibility, emergency players, unresolved result disputes
   and website problems.

There is no separate technical-support card: the requirements do not name a
technical support contact, so website problems go to the association that runs
the platform. Volunteers' personal phone numbers and emails are never shown;
only the club's or association's official contacts.

## Data and API handoff
frontend/data/mock-support-contacts.ts holds Chloe Cooper's (PLR005) contacts
from the workbook (TEAM018/UR012, CLB01/UR003, ASSOC01/UR002).
frontend/api/support-contacts.ts exports SupportContactsData and
getSupportContacts(signal). Set VITE_SUPPORT_CONTACTS_API_URL to the endpoint;
expected response { data: SupportContactsData }. Any of team, club or
association may be null, and any field may be null; the card then shows
general advice instead. Errors never fall back to mock contacts.
