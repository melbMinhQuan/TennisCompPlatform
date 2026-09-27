import type { CompetitionEntry } from "../types/competition";

const previewPlayer = {
  id: "PLR001",
  name: "Raj Mitchell",
};

export const competitionMock: CompetitionEntry[] = [
  {
    id: "TEAM017",
    competitionId: "COMP01",
    name: "Weekend Senior",
    association: "Waverley Tennis",
    season: "Winter 2026",
    section: "Section 1",
    seasonStatus: "ACTIVE",

    player: previewPlayer,

    club: "Glen Waverley Tennis Club",
    team: "Glen Waverley A",

    format: "Team singles & doubles",

    nextFixture: {
      id: "FIX0161",
      round: 13,
      homeTeam: "Syndal A",
      awayTeam: "Glen Waverley A",
      date: "2026-09-27",
      time: "13:00",
      timeZone: "Australia/Melbourne",
      side: "Away",
      venue: "Syndal Tennis Centre",
      address: "68 Church Road, Syndal VIC 3106",
    },
  },

  {
    id: "TEAM034",
    competitionId: "COMP05",
    name: "Night Tennis",
    association: "Waverley Tennis",
    season: "Autumn 2026",
    section: "Section 1",
    seasonStatus: "COMPLETED",

    player: previewPlayer,

    club: "Mount Waverley Tennis Club",
    team: "Mount Waverley A",

    format: "Team doubles",

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