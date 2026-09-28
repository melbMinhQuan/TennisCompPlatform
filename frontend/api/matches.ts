import { competitionMock } from "../data/mock-competitions";
import { mockFixtures, mockResults } from "../data/mock-fixtures";
import type { CompetitionEntry } from "../types/competition";
import { getPlayerData } from "./client";

// Upcoming team fixture for the logged-in player's teams.
export type MatchFixture = {
  id: string;
  competitionEntryId: string; // Team ID; links to /dashboard/competitions/:entryId
  competition: string;
  season: string;
  association: string;
  section: string;
  format: string;
  round: number | null; // null for finals, which carry roundLabel instead
  roundLabel?: string | null; // "Semi Final", "Grand Final"; null for numbered rounds
  homeTeam: string;
  awayTeam: string;
  club: string;
  team: string;
  date: string | null; // YYYY-MM-DD local to the venue; null when postponed with no new date
  time: string | null; // HH:mm local to the venue
  side: "Home" | "Away";
  status: "Scheduled" | "Postponed" | "Completed" | "Cancelled";
  venue: string | null;
  address: string | null;
};

// A finalised rubber the logged-in player played in.
export type MatchResult = {
  id: string; // Rubber ID
  competition: string;
  round: number | null;
  roundLabel?: string | null;
  date: string; // YYYY-MM-DD
  discipline: "Singles" | "Doubles";
  players: string[];
  opponents: string[];
  club: string;
  team: string;
  section: string;
  result: "W" | "L" | "D";
  sets: { playerGames: number; opponentGames: number }[];
};

// Logged out: the sample preview (Chloe Cooper, from the workbook). Logged in: always
// the backend (GET /api/v1/player/{resource}), whose response is { data: [...] }.
// API errors are shown to the player; they never fall back to the sample data.
async function load<T extends unknown[]>(
  resource: string,
  mock: T,
  signal: AbortSignal,
  message: string,
  identity?: string,
): Promise<T> {
  if (!identity) return structuredClone(mock);
  const data = await getPlayerData<T>(resource, identity, signal, message);
  if (!Array.isArray(data)) throw new Error(message);
  return data;
}

export const getCompetitions = (
  signal: AbortSignal,
  identity?: string,
): Promise<CompetitionEntry[]> =>
  load(
    "competitions",
    competitionMock,
    signal,
    "We couldn’t load your competitions. Please try again.",
    identity,
  );

export const getFixtures = (
  signal: AbortSignal,
  identity?: string,
): Promise<MatchFixture[]> =>
  load(
    "fixtures",
    mockFixtures,
    signal,
    "We couldn’t load your fixtures. Please try again.",
    identity,
  );

export const getResults = (
  signal: AbortSignal,
  identity?: string,
): Promise<MatchResult[]> =>
  load(
    "results",
    mockResults,
    signal,
    "We couldn’t load your results. Please try again.",
    identity,
  );
