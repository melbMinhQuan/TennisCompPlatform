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

export function createClubTeam(input: Omit<ClubAdminTeam, "id">): ClubAdminTeam {
  const name = input.name.trim();
  const sectionId = input.sectionId.trim();
  if (!name || !sectionId) throw new Error("Team name and section are required.");
  if (teamsSnapshot.some(t => t.clubId === input.clubId &&
      t.sectionId.toLowerCase() === sectionId.toLowerCase() &&
      t.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new Error("A team with this name already exists in this section.");
  }
  let id: string;
  do { id = `DEMO-TEAM-${String(nextDemoId++).padStart(3, "0")}`; }
  while (teamsSnapshot.some(t => t.id === id));
  const team: ClubAdminTeam = { id, clubId: input.clubId, name, sectionId };
  mockTeams.push(team);
  teamsSnapshot = [...mockTeams];
  listeners.forEach(listener => listener());
  return team;
}
