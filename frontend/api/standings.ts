import snapshot from "../data/competition-standings.json";

// Workbook snapshot, joined by IDs. Backend mapping belongs in this adapter.
export type StandingsData = typeof snapshot;
const endpoint = import.meta.env.VITE_STANDINGS_API_URL as string | undefined;
export const standingsAreMock = !endpoint;
export const standingsPlayerName = snapshot.playerName;

export async function getStandings(signal: AbortSignal): Promise<StandingsData> {
  if (!endpoint) return structuredClone(snapshot);
  const response = await fetch(endpoint, { signal, credentials: "include" });
  if (!response.ok) throw new Error("We couldn’t load standings and rankings. Please try again.");
  // Expected { data: StandingsData }; server resolves player identity and access.
  const body = await response.json() as { data: StandingsData };
  return body.data;
}
