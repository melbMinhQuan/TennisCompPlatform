import { describe, expect, test } from "vitest";
import snapshot from "../data/competition-standings.json";
import type { StandingsData } from "../api/standings";
import { pickSection, unique, type Section } from "../components/standings/standings-helpers";

// Sections that differ only in what pickSection looks at: season status, start date, and whose teams play.
const section = (id: string, seasonStatus: string, seasonStartDate: string): Section =>
  ({ ...snapshot.sections[0], id, seasonStatus, seasonStartDate });
const currentMine = section("current-mine", "ACTIVE", "2026-04-04");
const currentOther = section("current-other", "ACTIVE", "2026-04-04");
const pastMine = section("past-mine", "COMPLETED", "2025-07-05");
const pastOther2025 = section("past-other-2025", "COMPLETED", "2025-10-11");
const pastOther2024 = section("past-other-2024", "ARCHIVED", "2024-07-06");
const upcoming = section("upcoming", "UPCOMING", "2026-10-03");

const ladderRow = (sectionId: string, teamId: string) => ({ ...snapshot.ladders[0], id: `${sectionId}-${teamId}`, sectionId, teamId });
const data: StandingsData = {
  ...snapshot,
  myTeamIds: ["MY-TEAM"],
  ladders: [
    ladderRow(currentMine.id, "MY-TEAM"), ladderRow(currentMine.id, "RIVALS"),
    ladderRow(currentOther.id, "RIVALS"),
    ladderRow(pastMine.id, "MY-TEAM"),
    ladderRow(pastOther2025.id, "RIVALS"), ladderRow(pastOther2024.id, "RIVALS"),
  ],
};

/** Every ordering of the given sections, since the API's order must not matter. */
function orderings(sections: Section[]): Section[][] {
  if (sections.length <= 1) return [sections];
  return sections.flatMap((first, i) => orderings(sections.filter((_, j) => j !== i)).map((rest) => [first, ...rest]));
}

describe("FE-008: which standings section opens", () => {
  test("the current season's section with my team, whatever the order", () => {
    for (const candidates of orderings([currentOther, currentMine, pastMine, pastOther2025])) {
      expect(pickSection(candidates, data)?.id).toBe("current-mine");
    }
  });

  test("a current section without my team beats a past one with it", () => {
    for (const candidates of orderings([pastMine, currentOther, pastOther2025])) {
      expect(pickSection(candidates, data)?.id).toBe("current-other");
    }
  });

  test("the current season opens even when a later season is already scheduled", () => {
    for (const candidates of orderings([upcoming, currentOther, pastMine])) {
      expect(pickSection(candidates, data)?.id).toBe("current-other");
    }
  });

  test("with no current season, the latest season by start date, without reordering the list it was given", () => {
    for (const candidates of orderings([pastOther2024, pastMine, pastOther2025])) {
      const before = candidates.map((section) => section.id);
      expect(pickSection(candidates, data)?.id).toBe("past-other-2025");
      expect(candidates.map((section) => section.id)).toEqual(before);
    }
  });

  test("nothing to choose from opens nothing", () => {
    expect(pickSection([], data)).toBeUndefined();
  });

  test("filter options list each one once, in the order first seen", () => {
    const options = [{ id: "B", name: "Box Hill" }, { id: "W", name: "Waverley" }, { id: "B", name: "Box Hill" }];
    expect(unique(options).map((option) => option.id)).toEqual(["B", "W"]);
  });
});
