import type { ReactNode } from "react";
import type { StandingsData } from "../../api/standings";
import { matchCardClass } from "../MatchesUI";

export type View = "teams" | "players" | "rankings";
export type Section = StandingsData["sections"][number];
export type Cohort = StandingsData["cohorts"][number];
export type TableRow = { id: string; mine: boolean; values: ReactNode[]; tag?: string | null };

export const STANDINGS_CARD_CLASS = `${matchCardClass} text-[#1a3049]`;
export const STANDINGS_CONTROL_CLASS =
  "mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-[#c6d3e3] bg-white px-3 text-sm text-[#1a3049] focus:outline-2 focus:outline-[#3f72af]";

export const TABLE_HEADERS: Record<View, string[]> = {
  teams: ["Pos", "Team", "Played", "Won", "Lost", "Drawn", "Rubbers F/A", "Sets F/A", "Games F/A", "Points"],
  players: ["Pos", "Player", "Rubbers played", "Won", "Lost", "Sets W/L", "Games W/L", "Win %"],
  rankings: ["Rank", "Player", "UTR", "Compared with group"],
};

export const TABLE_CAPTIONS: Record<View, string> = {
  teams: "Team standings",
  players: "Individual rubber standings",
  rankings: "Rating rankings",
};

export const TABLE_NOTES: Record<View, string> = {
  teams: "F/A = for / against (won / lost). Teams are ranked by points.",
  players: "Player standings count individual rubbers, not team fixtures. W/L = won / lost.",
  rankings: "“Better than 60%” = your UTR is higher than 60% of players in this group.",
};

/** "22 Sept 2026" in Melbourne time, or "Not available". */
export function dateLabel(value: string) {
  return value
    ? new Date(value).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Australia/Melbourne",
      })
    : "Not available";
}

/** Removes repeated options, keeping the first of each id. */
export function unique<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

/**
 * Which section to open when a filter changes: the current season (preferring a section
 * with the player's team), otherwise the latest season by start date. Array order does not matter.
 */
export function pickSection(candidates: Section[], data: StandingsData): Section | undefined {
  const hasMyTeam = (s: Section) =>
    data.ladders.some((r) => r.sectionId === s.id && data.myTeamIds.includes(r.teamId));
  return (
    candidates.find((s) => s.seasonStatus === "ACTIVE" && hasMyTeam(s)) ??
    candidates.find((s) => s.seasonStatus === "ACTIVE") ??
    [...candidates].sort((a, b) => b.seasonStartDate.localeCompare(a.seasonStartDate))[0]
  );
}
