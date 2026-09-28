import { competitionMock } from "../data/mock-competitions";
import { mockFixtures, mockResults } from "../data/mock-fixtures";
import type { CompetitionEntry } from "../types/competition";

// Upcoming team fixture for the logged-in player's teams.
export type MatchFixture = {
  id: string;
  competitionEntryId: string; // Team ID; links to /dashboard/competitions/:entryId
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
  round: number;
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

// Each adapter returns hardcoded workbook data until its env variable is set.
// Expected API response: { data: [...] }. Map a different backend shape here.
// API errors are shown to the player; they never fall back to the hardcoded data.
async function load<T>(
  url: string | undefined,
  mock: T,
  signal: AbortSignal,
  message: string,
  identity?: string,
): Promise<T> {
  if (!url && identity) throw new Error(message);
  if (!url) return structuredClone(mock);
  const response = await fetch(url, { signal, credentials: "include" });
  if (!response.ok) throw new Error(message);
  const body = (await response.json()) as { data: T };
  if (!Array.isArray(body.data)) throw new Error(message);
  return body.data;
}

export const getCompetitions = (
  signal: AbortSignal,
  identity?: string,
): Promise<CompetitionEntry[]> =>
  load(
    import.meta.env.VITE_COMPETITIONS_API_URL as string | undefined,
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
    import.meta.env.VITE_FIXTURES_API_URL as string | undefined,
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
    import.meta.env.VITE_RESULTS_API_URL as string | undefined,
    mockResults,
    signal,
    "We couldn’t load your results. Please try again.",
    identity,
  );
