// @vitest-environment jsdom
import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CareerSummary from "../components/profile/CareerSummary";

afterEach(cleanup);

describe("I-UI-003: career summary", () => {
  test("shows win %, titles, and the best rank with the group it was measured in", () => {
    render(
      <CareerSummary
        summary={{
          matchesPlayed: 27, winPercentage: 59.3, titlesWon: 0,
          bestUtrRank: { percentileRank: 28, rank: 72, cohort: { id: "c1", name: "Waverley Tennis adult singles" }, discipline: "SINGLES", recordedAt: "2026-09-01T00:05:00.000Z" },
        }}
      />,
    );
    expect(screen.getByText("59.3%")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy(); // zero titles is a real value, not "—"
    expect(screen.getByText("Top 72%")).toBeTruthy();
    expect(screen.getByText("Waverley Tennis adult singles")).toBeTruthy();
  });

  test("a player who was never ranked sees Not available, with no group line", () => {
    render(<CareerSummary summary={{ matchesPlayed: 0, winPercentage: null, titlesWon: null, bestUtrRank: null }} />);
    expect(screen.getByText("Not available")).toBeTruthy();
    expect(screen.queryByText(/Top \d+%/)).toBeNull();
    expect(screen.getAllByText("—")).toHaveLength(2); // win % and titles unknown
  });
});
