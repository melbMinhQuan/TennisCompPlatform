import { useSyncExternalStore } from "react";
import { mockTeams } from "./mock-club-admin-players";
import type { ClubAdminTeam } from "../types/clubAdminPlayer";

// In-memory only. The existing Detail, Add Players, and Manager pages
// read mockTeams directly, so keep the same array instance and append to it.
let teamsSnapshot: ClubAdminTeam[] = [...mockTeams];
const listeners = new Set<() => void>();
let nextDemoId = 1;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function getSnapshot() { return teamsSnapshot; }

export function useClubTeams() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function hasTeamNameInSeason(seasonId: string, name: string) {
  const normalizedName = name.trim().toLowerCase();
  return teamsSnapshot.some(
    team =>
      team.seasonId === seasonId &&
      team.name.trim().toLowerCase() === normalizedName,
  );
}

export function createClubTeam(input: Omit<ClubAdminTeam, "id">): ClubAdminTeam {
  const name = input.name.trim();
  const sectionId = input.sectionId.trim();
  const seasonId = input.seasonId.trim();
  if (!name || !sectionId || !seasonId) {
    throw new Error("Team name, season and section are required.");
  }
  if (hasTeamNameInSeason(seasonId, name)) {
    throw new Error("A team with this name already exists in this season.");
  }
  let id: string;
  do { id = `DEMO-TEAM-${String(nextDemoId++).padStart(3, "0")}`; }
  while (teamsSnapshot.some(team => team.id === id));
  const team: ClubAdminTeam = { ...input, id, name, sectionId, seasonId };
  mockTeams.push(team);
  teamsSnapshot = [...mockTeams];
  listeners.forEach(listener => listener());
  return team;
}
