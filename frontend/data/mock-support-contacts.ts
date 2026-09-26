import type { SupportContactsData } from "../api/support-contacts";

// Hardcoded until the backend endpoint exists. Chloe Cooper's (PLR005) contacts, joined from
// Project detail/competition_data.xlsx:
// - team: her current-season team TEAM018 (Mount Waverley A) → UserRole TEAM_MANAGER UR012 (PLR008), club CLB02
// - club: her primary club CLB01 (ClubMembership CM002) → UserRole CLUB_ADMIN UR003 (PLR006)
// - association: her primary association ASSOC01 → UserRole RECORDS_SECRETARY UR002 (PLR002)
// Only names of volunteers are shown; phone and email are the club's or association's own contacts.
export const mockSupportContacts: SupportContactsData = {
  team: {
    teamName: "Mount Waverley A",
    competitionName: "Weekend Senior",
    seasonLabel: "Winter 2026",
    managerName: "Yuki Green",
    clubName: "Mount Waverley Tennis Club",
    phone: "03 9739 6210",
    email: "admin@mountwaverleytc.example",
  },
  club: {
    clubName: "Glen Waverley Tennis Club",
    adminName: "Ethan Wright",
    phone: "03 9336 5357",
    email: "admin@glenwaverleytc.example",
    address: "20 Reserve Road, Glen Waverley VIC 3100",
  },
  association: {
    name: "Waverley Tennis",
    recordsSecretaryName: "Mia Coleman",
    phone: "03 9000 0000",
    email: "info@waverleytennis.example",
  },
};
