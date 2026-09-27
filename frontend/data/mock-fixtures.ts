export type MockFixture = {
  id: string;
  competitionEntryId: string;

  competition: string;
  season: string;
  association: string;
  section: string;
  format: string;

  round: number;

  homeTeam: string;
  awayTeam: string;

  club: string;
  team: string;

  dateLabel: string;
  timeLabel: string;

  side: "Home" | "Away";

  status: "Scheduled" | "Postponed" | "Completed";

  venue: string | null;
  address: string | null;
};

export type MockResult = {
  id: string;
  competition: string;
  round: number;
  dateLabel: string;

  discipline: "Singles" | "Doubles";

  players: string[];
  opponents: string[];

  club: string;
  team: string;
  section: string;

  result: "W" | "L";

  sets: {
    playerGames: number;
    opponentGames: number;
  }[];
};

export const mockFixtures: MockFixture[] = [
  {
    id: "FIX0161",
    competitionEntryId: "TEAM017",

    competition: "Weekend Senior",
    season: "Winter 2026",
    association: "Waverley Tennis",
    section: "Section 1",
    format: "Team singles & doubles",

    round: 13,

    homeTeam: "Syndal A",
    awayTeam: "Glen Waverley A",

    club: "Glen Waverley Tennis Club",
    team: "Glen Waverley A",

    dateLabel: "SUN 27 SEP",
    timeLabel: "1:00 PM",

    side: "Away",

    status: "Scheduled",

    venue: "Syndal Tennis Centre",
    address: "68 Church Road, Syndal VIC 3106",
  },

  {
    id: "FIX0165",
    competitionEntryId: "TEAM017",

    competition: "Weekend Senior",
    season: "Winter 2026",
    association: "Waverley Tennis",
    section: "Section 1",
    format: "Team singles & doubles",

    round: 14,

    homeTeam: "Mount Waverley A",
    awayTeam: "Glen Waverley A",

    club: "Glen Waverley Tennis Club",
    team: "Glen Waverley A",

    dateLabel: "SAT 03 OCT",
    timeLabel: "1:00 PM",

    side: "Away",

    status: "Scheduled",

    venue: "Waverley Tennis Regional Centre",
    address: "500 Springvale Road, Glen Waverley VIC 3150",
  },
];

export const mockResults: MockResult[] = [
  {
    id: "mock-result-1",

    competition: "Weekend Senior",
    round: 11,
    dateLabel: "12 SEP 2026",

    discipline: "Doubles",

    players: ["Raj Mitchell", "Mia Coleman"],

    opponents: [
      "Elena Roberts",
      "Daniel Hill",
    ],

    club: "Glen Waverley Tennis Club",
    team: "Glen Waverley A",
    section: "Section 1",

    result: "W",

    sets: [
      {
        playerGames: 6,
        opponentGames: 3,
      },
      {
        playerGames: 6,
        opponentGames: 0,
      },
    ],
  },
];
