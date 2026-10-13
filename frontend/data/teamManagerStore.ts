import { useSyncExternalStore } from "react";

type ManagerAssignments = Record<string, string>;

let assignments: ManagerAssignments = {};
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return assignments;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function useTeamManagers() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function assignTeamManager(
  teamId: string,
  playerId: string
) {
  assignments = {
    ...assignments,
    [teamId]: playerId,
  };
  notify();
}

export function removeTeamManager(teamId: string) {
  const next = { ...assignments };
  delete next[teamId];
  assignments = next;
  notify();
}
