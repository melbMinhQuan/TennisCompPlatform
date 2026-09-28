// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { NotificationItem } from "../api/dashboard";
import NotificationPanel from "../components/NotificationPanel";
import { PlayerSessionContext } from "../context/PlayerSession";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const notification = (overrides: Partial<NotificationItem>): NotificationItem => ({
  id: "n1", type: "MATCH_REMINDER", title: "Match Reminder", message: "Mount Waverley A play on Sunday.",
  createdAt: new Date().toISOString(), readAt: null, details: null, target: null, ...overrides,
});
const dateChange = notification({
  id: "n2", type: "MATCH_DATE_CHANGED", title: "Match Date Changed", message: "Your match has been rescheduled.",
  details: { previousDate: "2026-09-26", newDate: "2026-09-27" }, target: { type: "FIXTURE", id: "fixture-1" },
});
const session = { email: "", setEmail: () => {}, data: null, error: "", loading: false, reload: () => {} };

function renderPanel(items: NotificationItem[], hasMore: boolean, email = "") {
  render(
    <PlayerSessionContext.Provider value={{ ...session, email }}>
      <MemoryRouter>
        <NotificationPanel notifications={items} hasMore={hasMore} />
      </MemoryRouter>
    </PlayerSessionContext.Provider>,
  );
}

describe("I-UI-002: notifications card", () => {
  test("lists each notification with its time and the old → new date line", () => {
    renderPanel([dateChange, notification({})], false);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Sep 26 → Sep 27, 2026")).toBeTruthy();
    expect(within(rows[1]).getByText("Just now")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "View All" })).toBeNull(); // nothing more to show
  });

  test("a fixture notification links to that fixture; others are not links", () => {
    renderPanel([dateChange, notification({})], false);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/dashboard/matches/fixture-1");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  test("an empty list shows the empty state", () => {
    renderPanel([], false);
    expect(screen.getByText("No notifications")).toBeTruthy();
  });

  test("View All loads the full list from the backend, and Show less collapses it", async () => {
    const all = [dateChange, notification({}), notification({ id: "n3", title: "Start Venue Changed", type: "VENUE_CHANGED" })];
    const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify({ data: { items: all, hasMore: false, nextCursor: null, available: true, unreadCount: 3 } })));
    vi.stubGlobal("fetch", fetchMock);
    renderPanel([dateChange], true, "chloe@club.example");

    fireEvent.click(screen.getByRole("button", { name: "View All" }));
    expect(await screen.findByText("Start Venue Changed")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/v1/player-dashboard/notifications?email=chloe%40club.example");

    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
