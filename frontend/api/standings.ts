import snapshot from "../data/competition-standings.json";
import { getPlayerData } from "./client";

// The shape is the workbook snapshot's; the backend returns the same fields.
export type StandingsData = typeof snapshot;

/**
 * Returns the workbook snapshot without an identity; otherwise loads GET /api/v1/player/standings.
 * The API returns { data: StandingsData }; errors never fall back to the snapshot.
 */
export async function getStandings(
  signal: AbortSignal,
  identity?: string,
): Promise<StandingsData> {
  if (!identity) return structuredClone(snapshot);
  return getPlayerData<StandingsData>(
    "standings",
    identity,
    signal,
    "We couldn’t load standings and rankings. Please try again.",
  );
}
