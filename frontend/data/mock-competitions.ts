import type { CompetitionEntry } from "../types/competition";

// Hardcoded until the backend endpoint exists. Chloe Cooper's (PLR005) three team entries
// from Project detail/competition_data.xlsx (TeamPlayer TP0106, TP0210, TP0002).
const previewPlayer = {
  id: "PLR005",
  name: "Chloe Cooper",
};

export const competitionMock: CompetitionEntry[] = [
  {
    id: "TEAM018",
    competitionId: "COMP01",
    name: "Weekend Senior",
    association: "Waverley Tennis",
    season: "Winter 2026",
    section: "Section 1",
    seasonStatus: "ACTIVE",
    player: previewPlayer,
    club: "Mount Waverley Tennis Club",
    team: "Mount Waverley A",
    format: "Team singles & doubles",
    nextFixture: {
      id: "FIX0162",
      round: 13,
      homeTeam: "Mount Waverley A",
      awayTeam: "Pinewood A",
      date: "2026-09-27",
      time: "13:00",
      timeZone: "Australia/Melbourne",
      side: "Home",
      venue: "Mount Waverley Tennis Centre",
      address: "24 Park Road, Mount Waverley VIC 3103",
    },
  },
  {
    id: "TEAM035",
    competitionId: "COMP05",
    name: "Night Tennis",
    association: "Waverley Tennis",
    season: "Autumn 2026",
    section: "Section 1",
    seasonStatus: "COMPLETED",
    player: previewPlayer,
    club: "Syndal Tennis Club",
    team: "Syndal A",
    // MF13 Open Singles/Doubles Rubbers: 2 singles + 1 doubles.
    format: "Team singles & doubles",
    nextFixture: null,
  },
  {
    id: "TEAM001",
    competitionId: "COMP01",
    name: "Weekend Senior",
    association: "Waverley Tennis",
    season: "Winter 2025",
    section: "Section 1",
    seasonStatus: "COMPLETED",
    player: previewPlayer,
    club: "Glen Waverley Tennis Club",
    team: "Glen Waverley A",
    format: "Team singles & doubles",
    nextFixture: null,
  },
];
