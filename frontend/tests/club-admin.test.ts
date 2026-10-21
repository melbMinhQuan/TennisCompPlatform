import { afterEach, describe, expect, test, vi } from "vitest";
import { ApiError } from "../api/client";
import { dashboardSeasonSummary, defaultSeasonId, getClubAdminDashboard, type ClubAdminDashboardData } from "../api/club-admin-dashboard";
import {
  clubTeamsOf,
  filterClubFixtures,
  getClubAdminFixture,
  getClubAdminFixtures,
  isClubFixture,
  type ClubAdminFixture,
  type FixtureFilter,
} from "../api/club-admin-fixtures";
import { getClubAdminNotifications, markAllClubAdminNotificationsRead, markClubAdminNotificationRead } from "../api/club-admin-notifications";
import { addClubMember, createClubPlayer, getClubPlayer, getClubPlayers, searchRegistry } from "../api/club-admin-players";
import { getClubAdminSupportContacts } from "../api/club-admin-support";
import {
  addTeamPlayers,
  assignTeamManager,
  createClubTeam,
  getClubTeam,
  getClubTeams,
  getOpenSections,
  removeTeamManager,
  removeTeamPlayer,
} from "../api/club-admin-teams";
import { roleFromLogin } from "../api/user-role";
import { shortClubName } from "../utils/formatters";

afterEach(() => vi.unstubAllGlobals());

const ADMIN = "margaret.hayes@admin.example";
const AS_ADMIN = `email=${encodeURIComponent(ADMIN)}`;
const BASE = "http://localhost:3000/api/v1/club-admin";
const TEAM = "11111111-1111-4111-8111-111111111111";
const PLAYER = "22222222-2222-4222-8222-222222222222";
const signal = () => new AbortController().signal;

/** Replaces fetch with one canned backend answer, recording each request's URL and options. */
function backendAnswers(status: number, body: unknown) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
/** The method, URL and JSON body of the only request made. */
function sent(fetchMock: ReturnType<typeof backendAnswers>) {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  return { method: init?.method, url, body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) };
}

describe("I-FE-005: club administrator pages always load from the backend, as the signed-in administrator", () => {
  const reads = {
    dashboard: [() => getClubAdminDashboard(signal(), ADMIN), "dashboard"],
    fixtures: [() => getClubAdminFixtures(signal(), ADMIN), "fixtures"],
    "one fixture": [() => getClubAdminFixture("FIX/1", signal(), ADMIN), "fixtures/FIX%2F1"],
    notifications: [() => getClubAdminNotifications(signal(), ADMIN), "notifications"],
    contacts: [() => getClubAdminSupportContacts(signal(), ADMIN), "support-contacts"],
    players: [() => getClubPlayers(signal(), ADMIN), "players"],
    "one player": [() => getClubPlayer(PLAYER, signal(), ADMIN), `players/${PLAYER}`],
    teams: [() => getClubTeams(signal(), ADMIN), "teams"],
    "one team": [() => getClubTeam(TEAM, signal(), ADMIN), `teams/${TEAM}`],
    "open sections": [() => getOpenSections(signal(), ADMIN), "open-sections"],
  } as const;

  for (const [name, [load, path]] of Object.entries(reads)) {
    test(`${name}: GET ${path} names the administrator, never a club, and returns the data as-is`, async () => {
      const fetchMock = backendAnswers(200, { data: { live: name } });
      expect(await load()).toEqual({ live: name });
      expect(sent(fetchMock)).toEqual({ method: "GET", url: `${BASE}/${path}?${AS_ADMIN}`, body: undefined });
    });
  }

  test("a server failure shows a friendly message and never falls back to sample data", async () => {
    backendAnswers(503, { code: "DATA_UNAVAILABLE", message: "password=secret" });
    await expect(getClubAdminDashboard(signal(), ADMIN)).rejects.toThrow("We couldn’t load your club’s dashboard. Please try again.");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await expect(getClubPlayers(signal(), ADMIN)).rejects.toThrow("We couldn’t load your club’s players. Please try again.");
  });

  test("a refusal keeps the server's message and code, e.g. someone who is not a club administrator", async () => {
    backendAnswers(403, { statusCode: 403, code: "NOT_CLUB_ADMIN", message: "Only a club administrator can open this page" });
    const refusal = await getClubTeams(signal(), ADMIN).catch((error: unknown) => error);
    expect(refusal).toBeInstanceOf(ApiError);
    expect(refusal).toMatchObject({ status: 403, code: "NOT_CLUB_ADMIN", message: "Only a club administrator can open this page" });
  });

  test("without a signed-in administrator nothing is sent, and the page asks to log in again", async () => {
    const fetchMock = backendAnswers(200, { data: [] });
    await expect(getClubAdminFixtures(signal())).rejects.toThrow("Please log in again.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a cancelled request is not reported as a server problem", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("The user aborted a request.", "AbortError")));
    })));
    const controller = new AbortController();
    const pending = getClubAdminNotifications(controller.signal, ADMIN);
    controller.abort();
    await expect(pending).rejects.toHaveProperty("name", "AbortError");
  });
});

describe("I-FE-006: club administrator changes go to the backend with the right method and body", () => {
  const team = { id: TEAM, name: "Glen Waverley C" };
  const changes = {
    "create a team": [() => createClubTeam({ sectionId: "sec", name: "Glen Waverley C" }, ADMIN, signal()), "POST", "teams", { sectionId: "sec", name: "Glen Waverley C" }],
    "add players": [() => addTeamPlayers(TEAM, [PLAYER], ADMIN, signal()), "POST", `teams/${TEAM}/players`, { playerIds: [PLAYER] }],
    "remove a player": [() => removeTeamPlayer(TEAM, PLAYER, ADMIN, signal()), "DELETE", `teams/${TEAM}/players/${PLAYER}`, undefined],
    "assign a manager": [() => assignTeamManager(TEAM, PLAYER, ADMIN, signal()), "PUT", `teams/${TEAM}/manager`, { playerId: PLAYER }],
    "remove the manager": [() => removeTeamManager(TEAM, ADMIN, signal()), "DELETE", `teams/${TEAM}/manager`, undefined],
    "add a member": [() => addClubMember(PLAYER, ADMIN, signal()), "POST", `players/${PLAYER}/membership`, undefined],
    "register a player": [
      () => createClubPlayer({ firstName: "Ana", lastName: "Lee", dateOfBirth: "2001-02-03", gender: "FEMALE" }, ADMIN, signal()),
      "POST", "players", { firstName: "Ana", lastName: "Lee", dateOfBirth: "2001-02-03", gender: "FEMALE" },
    ],
    "mark a notice read": [() => markClubAdminNotificationRead("note-1", ADMIN, signal()), "PATCH", "notifications/note-1/read", undefined],
    "mark every notice read": [() => markAllClubAdminNotificationsRead(ADMIN, signal()), "PATCH", "notifications/read-all", undefined],
  } as const;

  for (const [name, [change, method, path, body]] of Object.entries(changes)) {
    test(`${name}: ${method} ${path}`, async () => {
      const fetchMock = backendAnswers(200, { data: team });
      expect(await change()).toEqual(team);
      expect(sent(fetchMock)).toEqual({ method, url: `${BASE}/${path}?${AS_ADMIN}`, body });
    });
  }

  test("a JSON body is labelled as JSON; a change without one sends no body at all", async () => {
    const fetchMock = backendAnswers(200, { data: team });
    await assignTeamManager(TEAM, PLAYER, ADMIN, signal());
    await removeTeamManager(TEAM, ADMIN, signal());
    expect(fetchMock.mock.calls.map(([, init]) => init?.headers)).toEqual([{ "Content-Type": "application/json" }, undefined]);
  });

  test("the registry search sends only what was typed, and never the administrator as the person searched for", async () => {
    const fetchMock = backendAnswers(200, { data: [] });
    await searchRegistry({ name: "Chloe Cooper", dateOfBirth: "", playerEmail: "" }, ADMIN, signal());
    await searchRegistry({ name: "Chloe", dateOfBirth: "1983-05-05", playerEmail: "chloe@club.example" }, ADMIN, signal());
    const queries = fetchMock.mock.calls.map(([url]) => Object.fromEntries(new URL(url).searchParams));
    expect(queries).toEqual([
      { name: "Chloe Cooper", email: ADMIN },
      { name: "Chloe", dateOfBirth: "1983-05-05", playerEmail: "chloe@club.example", email: ADMIN },
    ]);
  });

  test("a refusal keeps the server's explanation and its details, e.g. who cannot join a squad", async () => {
    const problems = [{ id: PLAYER, reason: "ALREADY_IN_TEAM" }];
    backendAnswers(422, { statusCode: 422, code: "PLAYERS_NOT_ELIGIBLE", message: "Some players cannot join this squad", players: problems });
    const refusal = await addTeamPlayers(TEAM, [PLAYER], ADMIN, signal()).catch((error: unknown) => error);
    expect(refusal).toMatchObject({ status: 422, code: "PLAYERS_NOT_ELIGIBLE", message: "Some players cannot join this squad" });
    expect((refusal as ApiError).body?.players).toEqual(problems);
  });

  test("validation messages are joined into one sentence", async () => {
    backendAnswers(400, { statusCode: 400, message: ["A team name is required", "Choose a section"], error: "Bad Request" });
    await expect(createClubTeam({ sectionId: "", name: "" }, ADMIN, signal())).rejects.toThrow("A team name is required Choose a section");
  });

  test("a server failure while saving says so plainly, without the technical detail", async () => {
    backendAnswers(500, { statusCode: 500, message: "Internal server error" });
    await expect(removeTeamPlayer(TEAM, PLAYER, ADMIN, signal())).rejects.toThrow("We couldn’t save this change. Please try again.");
  });
});

describe("I-FE-007: a record that is not the administrator's club's shows 'not found'", () => {
  const records = {
    team: () => getClubTeam(TEAM, signal(), ADMIN),
    player: () => getClubPlayer(PLAYER, signal(), ADMIN),
    fixture: () => getClubAdminFixture("not-a-uuid", signal(), ADMIN),
  };

  for (const [name, load] of Object.entries(records)) {
    test(`${name}: another club's (404) or a malformed ID (400) is null; other failures still show an error`, async () => {
      backendAnswers(404, { code: `${name.toUpperCase()}_NOT_FOUND`, message: "Not found" });
      expect(await load()).toBeNull();
      backendAnswers(400, { message: "Validation failed (uuid is expected)" });
      expect(await load()).toBeNull();
      backendAnswers(503, { code: "DATA_UNAVAILABLE", message: "Unavailable" });
      await expect(load()).rejects.toThrow(/Please try again/);
    });
  }
});

describe("I-FE-008: the login's role decides which pages open, and keeps the email they identify with", () => {
  test("a club administrator keeps their club and email; no role is a player", () => {
    expect(roleFromLogin(ADMIN, { role: "CLUB_ADMIN", clubId: "club-1", clubName: "Glen Waverley Tennis Club", displayName: "Margaret Hayes" }))
      .toEqual({ email: ADMIN, role: "CLUB_ADMIN", clubId: "club-1", clubName: "Glen Waverley Tennis Club", displayName: "Margaret Hayes" });
    expect(roleFromLogin("chloe@club.example", { role: null }))
      .toEqual({ email: "chloe@club.example", role: "PLAYER", clubId: null, clubName: null, displayName: null });
  });
});

describe("FE-013: the club administrator dashboard's season and short club names", () => {
  const season = (id: string, status: ClubAdminDashboardData["seasons"][number]["status"]) => ({ id, label: id, competition: "Weekend Senior", status });
  const team = (id: string, seasonId: string, changes: Partial<ClubAdminDashboardData["teams"][number]> = {}) => ({
    id, name: id, seasonId, competition: "Weekend Senior", section: "Section 1", squadCount: 6, managerName: "Ava Clark", ...changes,
  });
  const dashboard = (seasons: ClubAdminDashboardData["seasons"], teams: ClubAdminDashboardData["teams"] = []): ClubAdminDashboardData => ({
    asOf: "2026-10-18", club: { id: "club-1", code: "CLB01", name: "Glen Waverley Tennis Club", associationName: "Waverley Tennis", phone: null, email: null, address: null },
    adminName: "Margaret", activeMembers: 26, seasons, teams, unreadCount: 0, activity: [],
  });

  test("the dashboard opens on the season being played, else the next one, else the latest", () => {
    expect(defaultSeasonId(dashboard([season("2025", "COMPLETED"), season("2026", "ACTIVE"), season("2027", "UPCOMING")]))).toBe("2026");
    expect(defaultSeasonId(dashboard([season("2025", "COMPLETED"), season("2027", "UPCOMING")]))).toBe("2027");
    expect(defaultSeasonId(dashboard([season("2024", "ARCHIVED"), season("2025", "COMPLETED")]))).toBe("2025");
    expect(defaultSeasonId(dashboard([]))).toBe("");
  });

  test("only seasons still to be played ask for attention: a team with no manager or no active players", () => {
    const data = dashboard([season("2025", "COMPLETED"), season("2026", "ACTIVE"), season("2027", "UPCOMING")], [
      team("ready", "2026"), team("no-manager", "2026", { managerName: null }), team("empty", "2026", { squadCount: 0 }),
      team("old-no-manager", "2025", { managerName: null }), team("next-no-manager", "2027", { managerName: null }),
    ]);
    // A season that has not started yet is being set up, so its gaps count too.
    expect(dashboardSeasonSummary(data, "2027")).toMatchObject({ attention: [{ id: "next-no-manager" }] });
    expect(dashboardSeasonSummary(data, "2026")).toMatchObject({ attention: [{ id: "no-manager" }, { id: "empty" }] });
    expect(dashboardSeasonSummary(data, "2026").teams).toHaveLength(3);
    expect(dashboardSeasonSummary(data, "2025")).toMatchObject({ teams: [{ id: "old-no-manager" }], attention: [] });
  });

  test("a club's short name drops 'Tennis Club', and leaves any other name whole", () => {
    expect(shortClubName("Glen Waverley Tennis Club")).toBe("Glen Waverley");
    expect(shortClubName("Waverley Indoor Centre")).toBe("Waverley Indoor Centre");
  });
});

const OURS = "club-ours";
const ourTeam = (id: string, name: string) => ({ id, name, clubId: OURS });
const theirTeam = (id: string, name: string) => ({ id, name, clubId: "OTHER-CLUB" });

let made = 0;
/** One of the administrator's club's fixtures; a test changes only what it is about. */
function fixture(changes: Partial<ClubAdminFixture> = {}): ClubAdminFixture {
  made += 1;
  return {
    id: `FIX-${made}`, clubId: OURS, homeTeam: ourTeam("OUR-A", "Glen Waverley A"), awayTeam: theirTeam("THEIR-A", "Burwood A"),
    competition: "Weekend Senior", seasonId: "SEA02", seasonLabel: "Winter 2026", section: "Section 1", round: "Round 4",
    date: "2026-05-02", time: "13:00", status: "SCHEDULED", changed: false,
    venue: { name: "Glen Waverley Tennis Centre", address: null }, result: null,
    ...changes,
  };
}
const recorded = { status: "FINALISED" as const, homeRubbers: 5, awayRubbers: 3, rubbers: [] };
const ids = (fixtures: ClubAdminFixture[], changes: Partial<FixtureFilter> = {}) =>
  filterClubFixtures(fixtures, { view: "fixtures", season: "all", team: "all", search: "", ...changes }).map((f) => f.id);

describe("FE-010: which fixtures and teams are the administrator's club's", () => {
  test("a fixture counts only when one of the club's teams plays in it, home or away", () => {
    expect(isClubFixture(fixture())).toBe(true);
    expect(isClubFixture(fixture({ homeTeam: theirTeam("THEIR-B", "Burwood B"), awayTeam: ourTeam("OUR-B", "Glen Waverley B") }))).toBe(true);
    // Filed under a club that neither side belongs to.
    expect(isClubFixture(fixture({ clubId: "THIRD-CLUB" }))).toBe(false);
    expect(isClubFixture(fixture({ homeTeam: theirTeam("THEIR-B", "Burwood B") }))).toBe(false);
  });

  test("the team list has each of the club's own teams once, never an opponent", () => {
    const fixtures = [fixture(), fixture(), fixture({ homeTeam: theirTeam("THEIR-B", "Burwood B"), awayTeam: ourTeam("OUR-B", "Glen Waverley B") })];
    expect(clubTeamsOf(fixtures)).toEqual([["OUR-A", "Glen Waverley A"], ["OUR-B", "Glen Waverley B"]]);
  });
});

describe("FE-011: club administrator Fixtures and Results tabs", () => {
  test("Fixtures lists what is still to play, soonest first and undated last; Results lists recorded results, newest first", () => {
    const later = fixture({ date: "2026-06-13" });
    const sooner = fixture({ date: "2026-05-02" });
    const postponed = fixture({ date: null, status: "POSTPONED" });
    const played = fixture({ date: "2026-04-18", status: "COMPLETED", result: recorded });
    const playedEarlier = fixture({ date: "2026-04-04", status: "COMPLETED", result: recorded });
    const all = [later, played, postponed, sooner, playedEarlier];
    expect(ids(all)).toEqual([sooner.id, later.id, postponed.id]);
    expect(ids(all, { view: "results" })).toEqual([played.id, playedEarlier.id]);
  });

  test("season, team (home or away) and search narrow the list; another club's fixture never shows", () => {
    const thisSeason = fixture();
    const lastSeason = fixture({ seasonId: "SEA01" });
    const awayGame = fixture({ homeTeam: theirTeam("THEIR-B", "Burwood B"), awayTeam: ourTeam("OUR-B", "Glen Waverley B") });
    const elsewhere = fixture({ venue: { name: "Mount Waverley Reserve", address: null } });
    const midWeek = fixture({ competition: "Mid-Week Mens" });
    const anotherClubs = fixture({ homeTeam: theirTeam("THEIR-C", "Syndal A"), awayTeam: theirTeam("THEIR-D", "Ashwood A") });
    const all = [thisSeason, lastSeason, awayGame, elsewhere, midWeek, anotherClubs];
    expect(ids(all).sort()).toEqual([thisSeason, lastSeason, awayGame, elsewhere, midWeek].map((f) => f.id).sort());
    expect(ids(all, { season: "SEA01" })).toEqual([lastSeason.id]);
    expect(ids(all, { team: "OUR-B" })).toEqual([awayGame.id]);
    expect(ids(all, { search: "  MOUNT waverley " })).toEqual([elsewhere.id]);
    expect(ids(all, { search: "mid-week" })).toEqual([midWeek.id]);
  });
});
