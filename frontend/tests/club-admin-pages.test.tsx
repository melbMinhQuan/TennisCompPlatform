// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { ReactNode } from "react";
import type { ClubPlayer } from "../api/club-admin-players";
import type { ClubTeamDetail, ClubTeamSummary, OpenSection } from "../api/club-admin-teams";
import type { ClubAdminNotification } from "../api/club-admin-notifications";
import type { ClubAdminDashboardData } from "../api/club-admin-dashboard";
import { useClubAdminData } from "../api/useApiData";
import ClubAdminLayout from "../components/ClubAdminLayout";
import RequireClubAdmin from "../components/RequireClubAdmin";
import ClubAdminNotifications from "../context/ClubAdminNotifications";
import RoleSession from "../context/RoleSession";
import ClubAdminAddPlayerPage from "../pages/ClubAdminAddPlayerPage";
import ClubAdminDashboardPage from "../pages/ClubAdminDashboardPage";
import ClubAdminNotificationsPage from "../pages/ClubAdminNotificationsPage";
import ClubAdminPlayersPage from "../pages/ClubAdminPlayersPage";
import ClubAdminTeamAssignManagerPage from "../pages/ClubAdminTeamAssignManagerPage";
import ClubAdminTeamCreatePage from "../pages/ClubAdminTeamCreatePage";
import ClubAdminTeamDetailPage from "../pages/ClubAdminTeamDetailPage";

const STORAGE_KEY = "waverley-signed-in-role";
const ADMIN = {
  email: "margaret.hayes@admin.example", role: "CLUB_ADMIN", clubId: "club-glen",
  clubName: "Glen Waverley Tennis Club", displayName: "Margaret Hayes",
};
const TEAM = "11111111-1111-4111-8111-111111111111";
const [AVA, BEN, DAN] = ["a", "b", "d"].map((n) => `00000000-0000-4000-8000-00000000000${n}`);

beforeEach(() => {
  // The layout scrolls to the top on every page; jsdom has no scrolling.
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

type Call = { method: string; path: string; body: unknown; query: URLSearchParams };
type Answer = { data: unknown } | { status: number; error: Record<string, unknown> };

/**
 * A fake backend for /api/v1/club-admin: each route answers from the test's own state, so a
 * change is seen by the next request, as in the real app. Records every call.
 */
function fakeBackend(routes: Record<string, (call: Call) => Answer>) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const { pathname, searchParams } = new URL(url);
    const call = {
      method: init?.method ?? "GET",
      path: pathname.replace("/api/v1/club-admin/", ""),
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
      query: searchParams,
    };
    calls.push(call);
    const route = routes[`${call.method} ${call.path}`];
    const answer = route ? route(call) : { status: 404, error: { statusCode: 404, message: `No fake for ${call.method} ${call.path}` } };
    return "error" in answer
      ? new Response(JSON.stringify(answer.error), { status: answer.status })
      : new Response(JSON.stringify({ data: answer.data }));
  }));
  return calls;
}
const changes = (calls: Call[]) => calls.filter((call) => call.method !== "GET").map((call) => [call.method, call.path, call.body]);

/** The club admin pages as the app routes them, opened at `path` as Margaret (signed in on an earlier visit). */
function openAsAdmin(path: string, signedIn: object = ADMIN) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(signedIn));
  render(
    <RoleSession>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/club-admin" element={<RequireClubAdmin><ClubAdminNotifications><ClubAdminLayout /></ClubAdminNotifications></RequireClubAdmin>}>
            <Route index element={<ClubAdminDashboardPage />} />
            <Route path="players" element={<ClubAdminPlayersPage />} />
            <Route path="players/add" element={<ClubAdminAddPlayerPage />} />
            <Route path="teams/create" element={<ClubAdminTeamCreatePage />} />
            <Route path="teams/:teamId" element={<ClubAdminTeamDetailPage />} />
            <Route path="teams/:teamId/add-players" element={<p>Add players page</p>} />
            <Route path="teams/:teamId/manager" element={<ClubAdminTeamAssignManagerPage />} />
            <Route path="notifications" element={<ClubAdminNotificationsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </RoleSession>,
  );
}
const sidebar = () => within(screen.getByRole("navigation", { name: "Club admin menu" }));

const notice = (id: string, readAt: string | null = null): ClubAdminNotification => ({
  id, type: "VENUE_CHANGED", title: `Venue changed ${id}`, message: "Your match has moved.", match: "Round 13 · Syndal A vs Glen Waverley A",
  details: null, targetType: "FIXTURE", targetId: `fixture-${id}`, readAt, createdAt: "2026-10-10T00:00:00.000Z",
});
const dashboard = (unreadCount: number): ClubAdminDashboardData => ({
  asOf: "2026-10-18",
  club: { id: "club-glen", name: "Glen Waverley Tennis Club", associationName: "Waverley Tennis", phone: null, email: null, address: null },
  adminName: "Margaret", activeMembers: 26,
  seasons: [{ id: "s2026", label: "Winter 2026", competition: "Weekend Senior", status: "ACTIVE" }],
  teams: [{ id: TEAM, name: "Glen Waverley A", seasonId: "s2026", competition: "Weekend Senior", section: "Section 1", squadCount: 6, managerName: "Ava Clark" }],
  unreadCount, activity: [],
});
const season = { seasonId: "s2026", seasonLabel: "Winter 2026", seasonStatus: "ACTIVE" as const, competitionId: "comp", competitionName: "Weekend Senior" };
const squadPlace = (id: string, firstName: string, lastName: string) => ({ id, firstName, lastName, status: "ACTIVE" as const, registeredAt: null });
const team = (changes: Partial<ClubTeamDetail> = {}): ClubTeamDetail => ({
  id: TEAM, name: "Glen Waverley A", sectionId: "sec-1", sectionName: "Section 1", ...season,
  managerName: "Ava Clark", manager: { playerId: AVA, name: "Ava Clark", email: "ava@club.example" },
  players: [squadPlace(AVA, "Ava", "Clark"), squadPlace(BEN, "Ben", "Adams")],
  ...changes,
});
const member = (id: string, firstName: string, lastName: string, changes: Partial<ClubPlayer> = {}): ClubPlayer => ({
  id, firstName, lastName, status: "ACTIVE", membership: { status: "ACTIVE", isPrimary: true, startDate: "2025-05-06", endDate: null },
  teamNames: [], hasLogin: true, role: "PLAYER", managedTeam: null, ...changes,
});

describe("I-UI-006: club administrator sign-in survives a reload and identifies every request", () => {
  test("a remembered club administrator opens their dashboard, loaded from the backend as them", async () => {
    const calls = fakeBackend({ "GET dashboard": () => ({ data: dashboard(0) }), "GET notifications": () => ({ data: [] }) });
    openAsAdmin("/club-admin");
    expect(await screen.findByRole("heading", { name: "Welcome, Margaret" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Glen Waverley Tennis Club" })).toBeTruthy();
    expect(calls.map((call) => [call.path, call.query.get("email")])).toEqual(
      expect.arrayContaining([["dashboard", ADMIN.email], ["notifications", ADMIN.email]]),
    );
  });

  test("a role remembered before the email was kept goes back to the login page, without calling the backend", async () => {
    const calls = fakeBackend({});
    const { email: _email, ...withoutEmail } = ADMIN;
    openAsAdmin("/club-admin", withoutEmail);
    expect(await screen.findByText("Login page")).toBeTruthy();
    expect(calls).toEqual([]);
  });

  test("the Players page lists the members the backend returns, linking each to their page", async () => {
    fakeBackend({
      "GET notifications": () => ({ data: [] }),
      "GET players": () => ({ data: [member(AVA, "Ava", "Clark", { teamNames: ["Glen Waverley A"] }), member(BEN, "Ben", "Adams", { membership: { status: "ACTIVE", isPrimary: false, startDate: null, endDate: null } })] }),
    });
    openAsAdmin("/club-admin/players");
    expect(await screen.findByRole("heading", { name: "Active players (2)" })).toBeTruthy();
    expect(screen.getByText(`${AVA} · Glen Waverley A`)).toBeTruthy();
    expect(screen.getByText("Additional club")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "View ›" }).map((link) => link.getAttribute("href"))).toEqual([`/club-admin/players/${AVA}`, `/club-admin/players/${BEN}`]);
  });
});

describe("I-UI-007: marking notifications read is saved, and the badge, tile and list agree", () => {
  function notices() {
    const stored = [notice("n1"), notice("n2"), notice("n3", "2026-10-11T00:00:00.000Z")];
    const calls = fakeBackend({
      "GET notifications": () => ({ data: stored }),
      "GET dashboard": () => ({ data: dashboard(stored.filter((item) => !item.readAt).length) }),
      "PATCH notifications/n1/read": () => ({ data: { ...stored[0], readAt: "2026-10-18T01:00:00.000Z" } }),
      "PATCH notifications/read-all": () => ({ data: { updated: 1 } }),
    });
    return calls;
  }

  test("Mark as read saves the notice, then the sidebar badge and the Unread tab count one fewer", async () => {
    const calls = notices();
    openAsAdmin("/club-admin/notifications");
    expect(await screen.findByRole("button", { name: "Unread (2)" })).toBeTruthy();
    expect(sidebar().getByRole("link", { name: "Notifications (2)" })).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Mark as read" })[0]);
    expect(await screen.findByRole("button", { name: "Unread (1)" })).toBeTruthy();
    expect(sidebar().getByRole("link", { name: "Notifications (1)" })).toBeTruthy();
    expect(changes(calls)).toEqual([["PATCH", "notifications/n1/read", undefined]]);

    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(await screen.findByText("You’re all caught up. There are no unread notifications.")).toBeTruthy();
    expect(sidebar().getByRole("link", { name: "Notifications" })).toBeTruthy();
    expect(changes(calls)).toEqual([["PATCH", "notifications/n1/read", undefined], ["PATCH", "notifications/read-all", undefined]]);
  });

  test("the dashboard's unread tile counts the same list, and a fixture notice links to that fixture", async () => {
    notices();
    openAsAdmin("/club-admin");
    const tile = await screen.findByRole("link", { name: /Unread notices/ });
    expect(tile.textContent).toMatch(/Unread notices\s*2/);
    fireEvent.click(sidebar().getByRole("link", { name: "Notifications (2)" }));
    expect((await screen.findAllByRole("link", { name: "View fixture ›" }))[0].getAttribute("href")).toBe("/club-admin/fixtures/fixture-n1");
  });

  test("a failed save says so and leaves the notice unread", async () => {
    fakeBackend({
      "GET notifications": () => ({ data: [notice("n1")] }),
      "PATCH notifications/n1/read": () => ({ status: 503, error: { code: "DATA_UNAVAILABLE", message: "Notifications cannot be updated right now" } }),
    });
    openAsAdmin("/club-admin/notifications");
    fireEvent.click(await screen.findByRole("button", { name: "Mark as read" }));
    expect((await screen.findByRole("alert")).textContent).toBe("We couldn’t mark this notification as read. Please try again.");
    expect(screen.getByRole("button", { name: "Unread (1)" })).toBeTruthy();
  });
});

describe("I-UI-008: team details show the backend's squad and manager, and removing someone is saved", () => {
  test("the manager is named with their Player ID and email, and marked in the squad", async () => {
    fakeBackend({ "GET notifications": () => ({ data: [] }), [`GET teams/${TEAM}`]: () => ({ data: team() }) });
    openAsAdmin(`/club-admin/teams/${TEAM}`);
    expect(await screen.findByRole("heading", { name: "Squad (2)" })).toBeTruthy();
    const managerCard = screen.getByRole("heading", { name: "Team manager" }).parentElement!;
    expect(managerCard.textContent).toContain(`Player ID: ${AVA}`);
    expect(managerCard.textContent).toContain("ava@club.example");
    const avaRow = screen.getByText(AVA, { selector: "p" }).closest("div")!.parentElement!;
    expect(within(avaRow).getByText("Team manager")).toBeTruthy();
  });

  test("removing a player sends DELETE and shows the squad the backend answered", async () => {
    let stored = team();
    const calls = fakeBackend({
      "GET notifications": () => ({ data: [] }),
      [`GET teams/${TEAM}`]: () => ({ data: stored }),
      [`DELETE teams/${TEAM}/players/${BEN}`]: () => {
        stored = team({ players: [squadPlace(AVA, "Ava", "Clark")] });
        return { data: stored };
      },
    });
    openAsAdmin(`/club-admin/teams/${TEAM}`);
    fireEvent.click((await screen.findAllByRole("button", { name: "Remove" }))[1]);
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove player" }));
    expect((await screen.findByRole("status")).textContent).toBe("Ben Adams was removed from the squad.");
    expect(screen.getByRole("heading", { name: "Squad (1)" })).toBeTruthy();
    expect(changes(calls)).toEqual([["DELETE", `teams/${TEAM}/players/${BEN}`, undefined]]);
  });

  test("a refusal is shown in the card it is about, and nothing changes on the page", async () => {
    fakeBackend({
      "GET notifications": () => ({ data: [] }),
      [`GET teams/${TEAM}`]: () => ({ data: team() }),
      [`DELETE teams/${TEAM}/manager`]: () => ({ status: 409, error: { code: "SEASON_CLOSED", message: "This team's season has finished" } }),
    });
    openAsAdmin(`/club-admin/teams/${TEAM}`);
    fireEvent.click(await screen.findByRole("button", { name: "Remove manager" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove manager" }));
    const managerCard = screen.getByRole("heading", { name: "Team manager" }).parentElement!;
    expect((await within(managerCard).findByRole("alert")).textContent).toBe("This team's season has finished");
    expect(managerCard.textContent).toContain("Ava Clark");
  });

  test("a team that is not the club's says so", async () => {
    fakeBackend({ "GET notifications": () => ({ data: [] }), [`GET teams/${TEAM}`]: () => ({ status: 404, error: { code: "TEAM_NOT_FOUND", message: "Team not found" } }) });
    openAsAdmin(`/club-admin/teams/${TEAM}`);
    expect(await screen.findByRole("heading", { name: "Team not found" })).toBeTruthy();
    expect(screen.getByText(/does not belong\s+to Glen Waverley Tennis Club/)).toBeTruthy();
  });
});

describe("I-UI-009: assigning a team manager", () => {
  test("players who cannot manage are shown with the reason; assigning one who can is saved, then the team opens", async () => {
    let stored = team();
    const calls = fakeBackend({
      "GET notifications": () => ({ data: [] }),
      [`GET teams/${TEAM}`]: () => ({ data: stored }),
      "GET players": () => ({
        data: [
          member(AVA, "Ava", "Clark", { role: "TEAM_MANAGER", managedTeam: { id: TEAM, name: "Glen Waverley A" } }),
          member(BEN, "Ben", "Adams", { hasLogin: false }),
          member("cara", "Cara", "Brown", { role: "RECORDS_SECRETARY" }),
          member(DAN, "Dan", "Evans"),
          member("eve", "Eve", "Fox", { role: "TEAM_MANAGER", managedTeam: { id: "other", name: "Glen Waverley B" } }),
          member("former", "Gus", "Hill", { membership: { status: "INACTIVE", isPrimary: true, startDate: null, endDate: "2026-01-01" } }),
        ],
      }),
      [`PUT teams/${TEAM}/manager`]: ({ body }) => {
        stored = team({ managerName: "Dan Evans", manager: { playerId: (body as { playerId: string }).playerId, name: "Dan Evans", email: "dan@club.example" } });
        return { data: stored };
      },
    });
    openAsAdmin(`/club-admin/teams/${TEAM}/manager`);
    const radio = async (name: RegExp) => (await screen.findByRole("radio", { name })) as HTMLInputElement;
    expect((await radio(/Ava Clark/)).checked).toBe(true);
    expect((await radio(/Ben Adams.*No login account/)).disabled).toBe(true);
    expect((await radio(/Cara Brown.*Holds another role \(Records secretary\)/)).disabled).toBe(true);
    expect((await radio(/Eve Fox.*Already manages Glen Waverley B/)).disabled).toBe(true);
    expect(screen.queryByRole("radio", { name: /Gus Hill/ })).toBeNull();

    fireEvent.click(await radio(/Dan Evans/));
    fireEvent.click(screen.getByRole("button", { name: "Assign manager" }));
    expect(await screen.findByText("Team manager updated successfully.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Team manager" }).parentElement!.textContent).toContain("Dan Evans");
    expect(changes(calls)).toEqual([["PUT", `teams/${TEAM}/manager`, { playerId: DAN }]]);
  });
});

describe("I-UI-010: adding a player searches the registry first, then saves the membership or the new record", () => {
  const chloe = {
    id: "chloe", firstName: "Chloe", lastName: "Cooper", match: { name: "exact", nameReasons: [], dateOfBirth: null, email: null },
    inThisClub: false, otherClubs: ["Mount Waverley Tennis Club"],
  };

  test("a registered player found by name is added to the club", async () => {
    const calls = fakeBackend({
      "GET notifications": () => ({ data: [] }),
      "GET registry/players": () => ({ data: [chloe] }),
      "POST players/chloe/membership": () => ({ data: { id: "chloe", firstName: "Chloe", lastName: "Cooper" } }),
    });
    openAsAdmin("/club-admin/players/add");
    fireEvent.change(await screen.findByLabelText(/Full name/), { target: { value: " Chloe Cooper " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByRole("heading", { name: "1 results for “Chloe Cooper”" })).toBeTruthy();
    expect(screen.getByText("Plays for Mount Waverley Tennis Club. Adding them keeps the same Player ID and history.")).toBeTruthy();
    expect(Object.fromEntries(calls.find((call) => call.path === "registry/players")!.query)).toEqual({ name: "Chloe Cooper", email: ADMIN.email });

    fireEvent.click(screen.getByRole("button", { name: "Add to my club" }));
    expect(await screen.findByRole("heading", { name: "Chloe Cooper is now in Glen Waverley Tennis Club" })).toBeTruthy();
    expect(changes(calls)).toEqual([["POST", "players/chloe/membership", undefined]]);
  });

  test("a new player with the same name and birthday as a record is refused, naming that record", async () => {
    const calls = fakeBackend({
      "GET notifications": () => ({ data: [] }),
      "GET registry/players": () => ({ data: [] }),
      "POST players": () => ({ status: 409, error: { code: "POSSIBLE_DUPLICATE", message: "A player with this name and date of birth is already registered", playerId: "chloe" } }),
    });
    openAsAdmin("/club-admin/players/add");
    fireEvent.change(await screen.findByLabelText(/Full name/), { target: { value: "Chloe Cooper" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: "Create new player" }));
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: "05/05/1983" } });
    fireEvent.change(screen.getByLabelText(/Gender/), { target: { value: "FEMALE" } });
    fireEvent.click(screen.getByRole("button", { name: "Create player" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Chloe Cooper (chloe) already has a record with this date of birth. Go back to the results and add that player instead.",
    );
    expect(changes(calls)).toEqual([["POST", "players", { firstName: "Chloe", lastName: "Cooper", dateOfBirth: "1983-05-05", gender: "FEMALE" }]]);
  });
});

describe("I-UI-011: creating a team in a season open for entries", () => {
  const section = (id: string, name: string): OpenSection => ({
    id, name, gender: null, ageGroup: "Adult", seasonId: "s2027", seasonLabel: "Summer 2026/27", seasonStatus: "UPCOMING",
    competitionId: "comp", competitionName: "Weekend Senior", teamCount: 0,
  });
  const clubTeam = (name: string, seasonId: string): ClubTeamSummary => ({
    id: name, name, sectionId: "sec", sectionName: "Section 1", ...season, seasonId, squadCount: 0, managerName: null,
  });

  test("the choices are the open sections, the suggested name is the next free letter, and the team is saved", async () => {
    const calls = fakeBackend({
      "GET notifications": () => ({ data: [] }),
      "GET open-sections": () => ({ data: [section("sec-1", "Section 1"), section("sec-2", "Section 2")] }),
      "GET teams": () => ({ data: [clubTeam("Glen Waverley A", "s2027"), clubTeam("Glen Waverley B", "s2026")] }),
      "POST teams": ({ body }) => ({ data: team({ id: "new-team", name: (body as { name: string }).name, seasonLabel: "Summer 2026/27", sectionName: "Section 2" }) }),
    });
    openAsAdmin("/club-admin/teams/create");
    const name = (await screen.findByLabelText(/Name/)) as HTMLInputElement;
    expect(name.value).toBe("Glen Waverley B");
    expect([...(screen.getByLabelText(/Section/) as HTMLSelectElement).options].map((option) => option.text)).toEqual(["Section 1", "Section 2"]);
    fireEvent.change(screen.getByLabelText(/Section/), { target: { value: "sec-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Create team" }));

    expect((await screen.findByRole("status")).textContent).toContain("Glen Waverley B is entered in Weekend Senior");
    expect(screen.getByRole("link", { name: "+ Add players" }).getAttribute("href")).toBe("/club-admin/teams/new-team/add-players");
    expect(changes(calls)).toEqual([["POST", "teams", { sectionId: "sec-2", name: "Glen Waverley B" }]]);
  });

  test("a name another club already uses this season is refused with the backend's reason", async () => {
    fakeBackend({
      "GET notifications": () => ({ data: [] }),
      "GET open-sections": () => ({ data: [section("sec-1", "Section 1")] }),
      "GET teams": () => ({ data: [] }),
      "POST teams": () => ({ status: 409, error: { code: "TEAM_NAME_TAKEN", message: "A team with this name is already entered in this season" } }),
    });
    openAsAdmin("/club-admin/teams/create");
    fireEvent.change(await screen.findByLabelText(/Name/), { target: { value: "Burwood A" } });
    fireEvent.click(screen.getByRole("button", { name: "Create team" }));
    expect((await screen.findByRole("alert")).textContent).toBe("A team with this name is already entered in this season");
  });
});

describe("I-UI-012: a page that changes its record never shows the previous record's data", () => {
  test("opening another team hides the first team's answer at once, even when it arrives late", async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ADMIN));
    const wrapper = ({ children }: { children: ReactNode }) => <RoleSession>{children}</RoleSession>;
    let release!: (value: string) => void;
    const first = vi.fn(() => new Promise<string>((resolve) => { release = resolve; }));
    const second = vi.fn(async () => "team B");
    const { result, rerender } = renderHook(({ load }) => useClubAdminData(load), { wrapper, initialProps: { load: first } });
    rerender({ load: second });
    expect(result.current).toMatchObject({ data: undefined, loading: true });
    await act(async () => release("team A"));
    expect(result.current).toMatchObject({ data: "team B", loading: false });
    expect(second).toHaveBeenCalledWith(expect.any(AbortSignal), ADMIN.email);
  });
});
