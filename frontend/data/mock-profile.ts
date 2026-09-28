import type { PlayerProfileData } from "../components/PlayerProfile";

// Shown on the Profile page when no one is logged in: Chloe Cooper (PLR005) from
// competition_data.xlsx, the same sample player as the other hardcoded pages.
export const MOCK_PLAYER: PlayerProfileData = {
  displayName: "Chloe Cooper",
  avatarUrl: undefined,
  status: "ACTIVE",
  age: 43, // date_of_birth 1983-05-05
  gender: "FEMALE",
  email: "chloe.cooper005@players.example",
  phone: "0478 027 095",
  clubs: ["Glen Waverley Tennis Club", "Mount Waverley Tennis Club", "Syndal Tennis Club", "Forest Hill Tennis Club"],
  teams: ["Mount Waverley A", "Syndal A", "Glen Waverley A"],
  association: "Waverley Tennis",
  playerId: "PLR005",
};

export const MOCK_UTR_RATING = 5.35; // UtrLink UTR005

// 27 finalised rubbers, 16 won; no premierships (one runners-up award).
// Best rank: 72nd of 100 in the singles cohort on 1 Sep 2026 (RankingEntry, percentile 28).
export const MOCK_CAREER_SUMMARY = {
  matchesPlayed: 27,
  winPercentage: 59.3,
  titlesWon: 0,
  bestUtrRank: {
    percentileRank: 28,
    rank: 72,
    cohort: { id: "COH01", name: "Waverley Tennis adult singles" },
    discipline: "SINGLES" as const,
    recordedAt: "2026-09-01T00:05:00.000Z",
  },
};
