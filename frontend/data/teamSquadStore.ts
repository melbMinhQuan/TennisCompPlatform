import { useSyncExternalStore } from "react";
import { mockTeamPlayers } from "./clubAdminPlayers";
import type { ClubAdminTeamPlayer } from "../types/clubAdminPlayer";

let teamPlayers: ClubAdminTeamPlayer[] = [...mockTeamPlayers];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return teamPlayers;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function useTeamPlayers() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function addPlayersToTeam(
  teamId: string,
  playerIds: string[]
) {
  const existing = new Set(
    teamPlayers
      .filter(
        (item) =>
          item.teamId === teamId &&
          item.status === "ACTIVE"
      )
      .map((item) => item.playerId)
  );

  const additions: ClubAdminTeamPlayer[] = playerIds
    .filter((id) => !existing.has(id))
    .map((playerId) => ({
      id: `DEMO-${teamId}-${playerId}`,
      teamId,
      playerId,
      status: "ACTIVE",
      registerAt: new Date().toISOString(),
    }));

  if (additions.length === 0) return;

  teamPlayers = [...teamPlayers, ...additions];
  notify();
}
