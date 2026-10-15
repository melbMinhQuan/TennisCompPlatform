import { useSyncExternalStore } from "react";
import { mockTeamPlayers } from "./mock-club-admin-players";
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

  const registerAt = new Date().toISOString();
  const requestedIds = [...new Set(playerIds)].filter(
    (playerId) => !existing.has(playerId)
  );
  if (requestedIds.length === 0) return;

  const additions: ClubAdminTeamPlayer[] = [];
  for (const playerId of requestedIds) {
    let inactiveIndex = -1;
    for (let index = teamPlayers.length - 1; index >= 0; index -= 1) {
      const item = teamPlayers[index];
      if (
        item.teamId === teamId &&
        item.playerId === playerId &&
        item.status === "INACTIVE"
      ) {
        inactiveIndex = index;
        break;
      }
    }

    if (inactiveIndex >= 0) {
      teamPlayers = teamPlayers.map((item, index) =>
        index === inactiveIndex
          ? { ...item, status: "ACTIVE", registerAt }
          : item
      );
      continue;
    }

    additions.push({
      id: `DEMO-${teamId}-${playerId}`,
      teamId,
      playerId,
      status: "ACTIVE",
      registerAt,
    });
  }

  teamPlayers = [...teamPlayers, ...additions];
  notify();
}

export function removePlayerFromTeam(
  teamId: string,
  playerId: string
): boolean {
  let removed = false;
  const nextTeamPlayers = teamPlayers.map<ClubAdminTeamPlayer>((item) => {
    if (
      item.teamId !== teamId ||
      item.playerId !== playerId ||
      item.status !== "ACTIVE"
    ) {
      return item;
    }

    removed = true;
    return { ...item, status: "INACTIVE" };
  });

  if (removed) {
    teamPlayers = nextTeamPlayers;
    notify();
  }
  return removed;
}
