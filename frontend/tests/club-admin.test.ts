import { describe, expect, test, vi, afterEach } from "vitest";
import { getClubAdminDashboard } from "../api/club-admin-dashboard";
import { clubTeamsOf, filterClubFixtures, getClubAdminFixtures, isClubFixture, type ClubAdminFixture, type FixtureFilter } from "../api/club-admin-fixtures";
import { getClubAdminNotifications } from "../api/club-admin-notifications";
import { getClubAdminSupportContacts } from "../api/club-admin-support";
import { clubAdminClubId } from "../data/club-admin-dashboard";

afterEach(() => vi.unstubAllGlobals());

const signal = () => new AbortController().signal;
const OURS = clubAdminClubId;
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
const recorded = { status: "FINALISED", homeRubbers: 5, awayRubbers: 3, rubbers: [] };
const ids = (fixtures: ClubAdminFixture[], changes: Partial<FixtureFilter> = {}) =>
  filterClubFixtures(fixtures, { view: "fixtures", season: "all", team: "all", search: "", ...changes }).map((f) => f.id);

/** The first string below the top level, which a page editing its own copy might change. */
function nestedString(value: unknown, depth = 0): [Record<string, unknown>, string] | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  for (const key of Object.keys(object)) {
    if (depth >= 1 && typeof object[key] === "string") return [object, key];
    const found = nestedString(object[key], depth + 1);
    if (found) return found;
  }
  return null;
}

describe("I-FE-005: club administrator pages use their sample data until the API exists", () => {
  const loaders = {
    dashboard: getClubAdminDashboard, fixtures: getClubAdminFixtures,
    notifications: getClubAdminNotifications, contacts: getClubAdminSupportContacts,
  };

  test("each page gets its own copy, so editing one never changes what the next gets, and nothing calls the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const [name, load] of Object.entries(loaders)) {
      const before = JSON.stringify(await load(signal()));
      const [holder, key] = nestedString(await load(signal()))!;
      holder[key] = "edited by a page";
      expect(JSON.stringify(await load(signal())), name).toBe(before);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a cancelled request returns nothing", async () => {
    const cancelled = new AbortController();
    cancelled.abort();
    for (const [name, load] of Object.entries(loaders)) {
      await expect(load(cancelled.signal), name).rejects.toThrow();
    }
  });
});

describe("FE-010: which fixtures and teams are the administrator's club's", () => {
  test("a fixture counts only when it is filed under the club and one of the club's teams plays, home or away", () => {
    expect(isClubFixture(fixture())).toBe(true);
    expect(isClubFixture(fixture({ homeTeam: theirTeam("THEIR-B", "Burwood B"), awayTeam: ourTeam("OUR-B", "Glen Waverley B") }))).toBe(true);
    expect(isClubFixture(fixture({ clubId: "OTHER-CLUB" }))).toBe(false);
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
    const anotherClubs = fixture({ clubId: "OTHER-CLUB" });
    const all = [thisSeason, lastSeason, awayGame, elsewhere, midWeek, anotherClubs];
    expect(ids(all).sort()).toEqual([thisSeason, lastSeason, awayGame, elsewhere, midWeek].map((f) => f.id).sort());
    expect(ids(all, { season: "SEA01" })).toEqual([lastSeason.id]);
    expect(ids(all, { team: "OUR-B" })).toEqual([awayGame.id]);
    expect(ids(all, { search: "  MOUNT waverley " })).toEqual([elsewhere.id]);
    expect(ids(all, { search: "mid-week" })).toEqual([midWeek.id]);
  });
});
