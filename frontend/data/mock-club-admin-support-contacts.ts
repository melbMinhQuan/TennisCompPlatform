import type { ClubAdminSupportContactsData } from "../api/club-admin-support";

// Hardcoded until the club admin API exists. Ethan Wright's (PLR006, UserRole UR003 CLUB_ADMIN for CLB01)
// contacts, joined from backend/prisma/competition_data.xlsx:
// - club: CLB01 Glen Waverley Tennis Club (Club sheet) – the contact details players see on their Help page
// - association: ASSOC01 Waverley Tennis (Association sheet)
//   → UserRole ADMINISTRATOR UR001 (PLR001 Raj Mitchell) and RECORDS_SECRETARY UR002 (PLR002 Mia Coleman)
// Volunteers are named only; phone and email are the club's or association's own contacts.
export const mockClubAdminSupportContacts: ClubAdminSupportContactsData = {
  club: {
    clubName: "Glen Waverley Tennis Club",
    phone: "03 9336 5357",
    email: "admin@glenwaverleytc.example",
    address: "20 Reserve Road, Glen Waverley VIC 3100",
  },
  association: {
    name: "Waverley Tennis",
    administratorName: "Raj Mitchell",
    recordsSecretaryName: "Mia Coleman",
    phone: "03 9000 0000",
    email: "info@waverleytennis.example",
  },
};
