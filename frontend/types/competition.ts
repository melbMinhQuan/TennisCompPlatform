import type { SeasonStatus } from "./season";

export type CompetitionEntry = {
  id: string;
  competitionId: string;

  name: string;
  association: string;
  season: string;
  section: string;

  seasonStatus: SeasonStatus;

  player: {
    id: string;
    /** The readable Player ID (PLR005); null only for a player added before codes were automatic. */
    code: string | null;
    name: string;
  };

  club: string;
  team: string;

  format: string;

  nextFixture: {
    id: string;
    round: number | null; // null for finals, which carry roundLabel instead
    roundLabel?: string | null;

    homeTeam: string;
    awayTeam: string;

    date: string | null;
    time: string | null;
    timeZone: string;

    side: "Home" | "Away";

    venue: string | null;
    address: string | null;
  } | null;
};