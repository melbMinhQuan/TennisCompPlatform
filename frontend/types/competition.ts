export type CompetitionEntry = {
  id: string;
  competitionId: string;

  name: string;
  association: string;
  season: string;
  section: string;

  seasonStatus: "ACTIVE" | "COMPLETED" | "ARCHIVED";

  player: {
    id: string;
    name: string;
  };

  club: string;
  team: string;

  format: string;

  nextFixture: {
    id: string;
    round: number;

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