// @vitest-environment jsdom
// What each role is shown about a junior (docs/junior-privacy.md). The backend decides what is sent
// (JUNIOR-001..013 and JUNIOR-101..109 there); these check that every page shows what it is sent,
// says why, and never fills a gap with something misleading.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { ReactNode } from "react";
import type { AssociationJuniors } from "../api/association-admin";
import type { ClubPlayer, ClubPlayerDetail, RegistryMatch } from "../api/club-admin-players";
import type { ClubTeamDetail } from "../api/club-admin-teams";
import type { PlayerMemberships } from "../api/memberships";
import type { TeamDetails } from "../api/teams";
import type { CompetitionEntry } from "../types/competition";
import { ageLimitLabel } from "../api/association-admin";
import { homeForRole } from "../api/user-role";
import AssociationAdminLayout from "../components/AssociationAdminLayout";
import PlayerProfile from "../components/PlayerProfile";
import RequireAssociationAdmin from "../components/RequireAssociationAdmin";
import { PlayerSessionContext } from "../context/PlayerSession";
import RoleSession from "../context/RoleSession";
import AssociationAdminJuniorsPage from "../pages/AssociationAdminJuniorsPage";
import ClubAdminAddPlayerPage from "../pages/ClubAdminAddPlayerPage";
import ClubAdminPlayerDetailPage from "../pages/ClubAdminPlayerDetailPage";
import ClubAdminTeamAssignManagerPage from "../pages/ClubAdminTeamAssignManagerPage";
import CompetitionsPage from "../pages/CompetitionsPage";
import MyClubsPage from "../pages/MyClubsPage";
import TeamDetailsPage from "../pages/TeamDetailsPage";

const STORAGE_KEY = "waverley-signed-in-role";
const TEAM = "11111111-1111-4111-8111-111111111111";
const LEO = "22222222-2222-4222-8222-222222222222";
const MAYA = "33333333-3333-4333-8333-333333333333";
const SIOBHAN = { name: "Siobhan Fitzgerald", email: "siobhan.fitzgerald@families.example", phone: "0413 200 700" };

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

/** Answers each API path (without /api/v1/) from the test; anything else is a 404. */
function fakeBackend(routes: Record<string, unknown>) {
  const paths: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const path = new URL(url).pathname.replace("/api/v1/", "");
    paths.push(path);
    return path in routes
      ? new Response(JSON.stringify({ data: routes[path] }))
      : new Response(JSON.stringify({ statusCode: 404, message: "Not found" }), { status: 404 });
  }));
  return paths;
}

/** A player page as the logged-in player `email`. */
function openAsPlayer(path: string, element: ReactNode, route: string, email = "adaeze.okafor@families.example") {
  const session = { email, setEmail: () => {}, data: null, error: "", loading: false, reload: () => {} };
  render(
    <PlayerSessionContext.Provider value={session}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </MemoryRouter>
    </PlayerSessionContext.Provider>,
  );
}

/** A role page as someone who signed in earlier in this tab (the role is kept in sessionStorage). */
function openSignedIn(path: string, signedIn: object, routes: ReactNode) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(signedIn));
  render(
    <RoleSession>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/dashboard" element={<p>Player dashboard</p>} />
          <Route path="/club-admin" element={<p>Club dashboard</p>} />
          {routes}
        </Routes>
      </MemoryRouter>
    </RoleSession>,
  );
}

const team = (viewerIsManager: boolean): TeamDetails => ({
  id: TEAM, name: "Glen Waverley 18U", clubId: "club-glen", competitionName: "Weekend Junior", seasonLabel: "Summer 2026/27",
  seasonStatus: "UPCOMING", sectionName: "18 & Under", clubName: "Glen Waverley Tennis Club", associationName: "Waverley Tennis",
  viewerIsManager,
  members: viewerIsManager
    ? [
        { id: LEO, name: "Leo Fitzgerald", status: "ACTIVE", isCurrentPlayer: false, isJunior: true, guardian: SIOBHAN },
        { id: MAYA, name: "Maya Okafor", status: "ACTIVE", isCurrentPlayer: false, isJunior: true, guardian: null },
      ]
    : [
        { id: LEO, name: "Leo Fitzgerald", status: "ACTIVE", isCurrentPlayer: false },
        { id: MAYA, name: "Maya Okafor", status: "ACTIVE", isCurrentPlayer: true },
      ],
});

describe("JUNIOR-UI-001: a team's page as its manager and as a teammate", () => {
  test("the manager sees each junior marked, with their parent's phone and email to call or write to", async () => {
    fakeBackend({ [`player/teams/${TEAM}`]: team(true) });
    openAsPlayer(`/dashboard/clubs/teams/${TEAM}`, <TeamDetailsPage />, "/dashboard/clubs/teams/:teamId");
    const leo = (await screen.findByText("Leo Fitzgerald")).closest("li")!;
    expect(within(leo).getByText("Junior")).toBeTruthy();
    expect(within(leo).getByRole("link", { name: SIOBHAN.phone }).getAttribute("href")).toBe("tel:0413200700");
    expect(within(leo).getByRole("link", { name: SIOBHAN.email }).getAttribute("href")).toBe(`mailto:${SIOBHAN.email}`);
    // A junior with no parent on record says so rather than showing nothing.
    expect(within(screen.getByText("Maya Okafor").closest("li")!).getByText("No parent or guardian contact recorded.")).toBeTruthy();
    expect(screen.getByRole("note").textContent).toContain("As team manager you can see the parent or guardian's phone and email");
    expect(screen.getByText("Members registered for the coming season.")).toBeTruthy();
  });

  test("a teammate sees the names only: no junior mark, no parent, no notice", async () => {
    fakeBackend({ [`player/teams/${TEAM}`]: team(false) });
    openAsPlayer(`/dashboard/clubs/teams/${TEAM}`, <TeamDetailsPage />, "/dashboard/clubs/teams/:teamId", "maya.okafor@juniors.example");
    expect(await screen.findByText("Leo Fitzgerald")).toBeTruthy();
    expect(screen.queryByText("Junior")).toBeNull();
    expect(screen.queryByRole("note")).toBeNull();
    expect(screen.queryByText(/Parent or guardian/)).toBeNull();
    expect(screen.queryAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/dashboard/clubs"]);
  });
});

test("JUNIOR-UI-002: My Clubs lists the team a manager runs, though they play in none", async () => {
  const memberships: PlayerMemberships = {
    player: { id: "parent", displayName: "Adaeze Okafor" },
    associations: [{ id: "am", associationId: "assoc", name: "Waverley Tennis", isPrimary: true, status: "ACTIVE", startDate: null, endDate: null }],
    clubs: [],
    teams: [],
    managedTeams: [{ id: TEAM, name: "Glen Waverley 18U", clubId: "club-glen", competitionName: "Weekend Junior", seasonLabel: "Summer 2026/27", seasonStatus: "UPCOMING", sectionName: "18 & Under" }],
  };
  fakeBackend({ "player/memberships": memberships });
  openAsPlayer("/dashboard/clubs", <MyClubsPage />, "/dashboard/clubs");
  const managed = (await screen.findByRole("heading", { name: "Teams you manage" })).closest("section")!;
  expect(within(managed).getByRole("link", { name: "Glen Waverley 18U" }).getAttribute("href")).toBe(`/dashboard/clubs/teams/${TEAM}`);
  expect(within(managed).getByText("Weekend Junior · Summer 2026/27 · 18 & Under")).toBeTruthy();
});

test("JUNIOR-UI-003: the junior's own profile explains who sees their details, and shows their parent", () => {
  render(
    <PlayerProfile
      player={{
        displayName: "Leo Fitzgerald", status: "ACTIVE", age: 16, gender: "MALE", email: "leo.fitzgerald@juniors.example",
        phone: "0414 300 800", clubs: ["Glen Waverley Tennis Club"], teams: ["Glen Waverley 18U"], association: "Waverley Tennis",
        playerId: "PLR113", isJunior: true, guardian: SIOBHAN,
      }}
    />,
  );
  expect(screen.getByRole("note").textContent).toContain("You are registered as a junior");
  expect(screen.getByText("Siobhan Fitzgerald · 0413 200 700 · siobhan.fitzgerald@families.example")).toBeTruthy();
  cleanup();
  // An adult's card has neither.
  render(<PlayerProfile player={{ displayName: "Chloe Cooper", status: "ACTIVE", age: 43, gender: "FEMALE", email: null, phone: null, clubs: [], teams: [], association: null, playerId: "PLR005" }} />);
  expect(screen.queryByRole("note")).toBeNull();
  expect(screen.queryByText(/Parent or guardian/)).toBeNull();
});

const MARGARET = { email: "margaret.hayes@admin.example", role: "CLUB_ADMIN", clubId: "club-glen", clubName: "Glen Waverley Tennis Club", displayName: "Margaret Hayes" };

test("JUNIOR-UI-004: a club admin sees every detail of their own club's junior, parent included", async () => {
  const leo: ClubPlayerDetail = {
    id: LEO, code: "PLR113", firstName: "Leo", lastName: "Fitzgerald", dateOfBirth: "2009-11-14", isJunior: true,
    email: "leo.fitzgerald@juniors.example", phone: "0414 300 800", guardian: SIOBHAN, status: "ACTIVE",
    memberships: [{ clubId: "club-glen", clubName: "Glen Waverley Tennis Club", status: "ACTIVE", isPrimary: true, startDate: "2025-08-02", endDate: null }],
    teams: [],
  };
  fakeBackend({ [`club-admin/players/${LEO}`]: leo });
  openSignedIn(`/club-admin/players/${LEO}`, MARGARET, <Route path="/club-admin/players/:playerId" element={<ClubAdminPlayerDetailPage />} />);
  const heading = await screen.findByRole("heading", { level: 1 });
  expect(heading.textContent).toBe("Leo FitzgeraldJunior");
  expect(screen.getByRole("note").textContent).toContain("Only your club and the association can see their details");
  const details = screen.getByRole("heading", { name: "Personal details" }).parentElement!;
  for (const value of ["14 Nov 2009", "leo.fitzgerald@juniors.example", "0414 300 800", SIOBHAN.phone, SIOBHAN.email]) {
    expect(within(details).getByText(value)).toBeTruthy();
  }
});

test("JUNIOR-UI-005: another club's admin searching for a junior is shown the name and ticks, and told why", async () => {
  const match: RegistryMatch = {
    id: LEO, code: "PLR113", firstName: "Leo", lastName: "Fitzgerald",
    match: { name: "exact", nameReasons: ["same first name", "same surname"], dateOfBirth: true, email: false },
    isJunior: true, inThisClub: false, otherClubs: [],
  };
  fakeBackend({ "club-admin/registry/players": [match] });
  openSignedIn("/club-admin/players/add", { ...MARGARET, clubId: "club-mount", clubName: "Mount Waverley Tennis Club" },
    <Route path="/club-admin/players/add" element={<ClubAdminAddPlayerPage />} />);
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Leo Fitzgerald" } });
  fireEvent.submit(screen.getByLabelText(/full name/i).closest("form")!);
  const result = (await screen.findByRole("heading", { level: 3, name: /Leo Fitzgerald/ })).closest("article")!;
  expect(within(result).getByText("Junior")).toBeTruthy();
  expect(result.textContent).toContain("Date of birth ✓");
  expect(result.textContent).toContain("Email ×");
  // Not "No current club membership": the clubs are withheld, not missing.
  expect(result.textContent).toContain("where they play is not shown to other clubs");
  expect(result.textContent).not.toContain("No current club membership");
  expect(screen.getByRole("note").textContent).toContain("Juniors from other clubs show their name only");
});

const juniors: AssociationJuniors = {
  asOf: "2026-10-21",
  association: { id: "assoc", name: "Waverley Tennis" },
  adminName: "Raj Mitchell",
  juniors: [
    {
      id: "ruby", code: "PLR122", firstName: "Ruby", lastName: "Achebe", dateOfBirth: "2013-06-11", age: 13, gender: "FEMALE", status: "ACTIVE",
      email: "ruby.achebe@juniors.example", phone: "0414 309 809",
      guardian: { name: "Chidi Achebe", email: "chidi.achebe@families.example", phone: "0413 208 708" },
      clubs: [{ clubId: "club-glen", name: "Glen Waverley Tennis Club", isPrimary: true, status: "ACTIVE" }],
      teams: [{
        teamId: "t12", teamName: "Glen Waverley 12U", clubName: "Glen Waverley Tennis Club", competitionName: "Weekend Junior", seasonLabel: "Summer 2026/27",
        seasonStatus: "UPCOMING", seasonStart: "2026-10-31", sectionName: "12 & Under", status: "ACTIVE", minAge: null, maxAge: 12, ageOnSeasonStart: 13, eligible: false,
      }],
    },
    {
      id: "leo", code: "PLR113", firstName: "Leo", lastName: "Fitzgerald", dateOfBirth: "2009-11-14", age: 16, gender: "MALE", status: "ACTIVE",
      email: "leo.fitzgerald@juniors.example", phone: "0414 300 800", guardian: SIOBHAN,
      clubs: [{ clubId: "club-glen", name: "Glen Waverley Tennis Club", isPrimary: true, status: "ACTIVE" }],
      teams: [{
        teamId: "t18", teamName: "Glen Waverley 18U", clubName: "Glen Waverley Tennis Club", competitionName: "Weekend Junior", seasonLabel: "Summer 2026/27",
        seasonStatus: "UPCOMING", seasonStart: "2026-10-31", sectionName: "18 & Under", status: "ACTIVE", minAge: null, maxAge: 18, ageOnSeasonStart: 16, eligible: true,
      }],
    },
  ],
};
const RAJ = { email: "raj.mitchell001@players.example", role: "ADMINISTRATOR", clubId: null, clubName: null, displayName: "Raj Mitchell" };
const associationRoutes = (
  <Route path="/association-admin" element={<RequireAssociationAdmin><AssociationAdminLayout /></RequireAssociationAdmin>}>
    <Route index element={<AssociationAdminJuniorsPage />} />
  </Route>
);

describe("JUNIOR-UI-006: the association admin sees every junior's details, with age checks", () => {
  test("each junior shows date of birth, age, contact and parent; an age problem is flagged and can be filtered", async () => {
    const paths = fakeBackend({ "association-admin/juniors": juniors });
    openSignedIn("/association-admin", RAJ, associationRoutes);
    const ruby = (await screen.findByRole("heading", { name: /Ruby Achebe/ })).closest("article")!;
    for (const value of ["11 Jun 2013", "13", "ruby.achebe@juniors.example", "0414 309 809", "Glen Waverley Tennis Club (primary)", "0413 208 708"]) {
      expect(within(ruby).getByText(value)).toBeTruthy();
    }
    expect(within(ruby).getByText("Age problem")).toBeTruthy();
    expect(within(ruby).getByText("✗ Too old for 12 & Under: 13 on 31 Oct 2026 (12 and under)")).toBeTruthy();
    const leo = screen.getByRole("heading", { name: /Leo Fitzgerald/ }).closest("article")!;
    expect(within(leo).getByText("✓ Eligible: 16 on 31 Oct 2026 (18 and under)")).toBeTruthy();
    expect(screen.getByText(/2 juniors, 1 outside a section's age limit/)).toBeTruthy();
    expect(screen.getByRole("note").textContent).toContain("shown in full so you can check age and eligibility");
    fireEvent.click(screen.getByLabelText("Only age problems"));
    expect(screen.queryByRole("heading", { name: /Leo Fitzgerald/ })).toBeNull();
    fireEvent.click(screen.getByLabelText("Only age problems"));
    fireEvent.change(screen.getByPlaceholderText("Name or Player ID"), { target: { value: "plr113" } });
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Leo Fitzgerald · PLR113"]);
    // Asked as the signed-in administrator.
    expect(paths).toEqual(["association-admin/juniors"]);
  });

  test("the page opens for the association's administrator only; anyone else goes to their own home", async () => {
    expect([homeForRole("ADMINISTRATOR"), homeForRole("CLUB_ADMIN"), homeForRole("TEAM_MANAGER"), homeForRole("PLAYER")])
      .toEqual(["/association-admin", "/club-admin", "/dashboard", "/dashboard"]);
    for (const [signedIn, landing] of [[MARGARET, "Club dashboard"], [{ ...RAJ, role: "TEAM_MANAGER" }, "Player dashboard"]] as const) {
      fakeBackend({});
      openSignedIn("/association-admin", signedIn, associationRoutes);
      expect(await screen.findByText(landing)).toBeTruthy();
      cleanup();
    }
    sessionStorage.clear();
    render(<MemoryRouter initialEntries={["/association-admin"]}><RoleSession><Routes><Route path="/login" element={<p>Login page</p>} />{associationRoutes}</Routes></RoleSession></MemoryRouter>);
    expect(await screen.findByText("Login page")).toBeTruthy();
  });

  test("age limits read as people say them", () => {
    expect([
      ageLimitLabel({ minAge: null, maxAge: 12 }), ageLimitLabel({ minAge: 18, maxAge: null }),
      ageLimitLabel({ minAge: 10, maxAge: 12 }), ageLimitLabel({ minAge: null, maxAge: null }),
    ]).toEqual(["12 and under", "18 and over", "Ages 10–12", null]);
  });
});

test("JUNIOR-UI-007: a junior cannot be picked as team manager, since a manager sees other juniors' parent contacts", async () => {
  const team: ClubTeamDetail = {
    id: TEAM, name: "Glen Waverley 12U", sectionId: "sec-12", sectionName: "12 & Under", seasonId: "s", seasonLabel: "Summer 2026/27",
    seasonStatus: "UPCOMING", competitionId: "c", competitionName: "Weekend Junior", managerName: null, manager: null, players: [],
  };
  const member = (id: string, firstName: string, lastName: string, isJunior: boolean): ClubPlayer => ({
    id, code: null, firstName, lastName, isJunior, status: "ACTIVE", membership: { status: "ACTIVE", isPrimary: true, startDate: null, endDate: null },
    teamNames: [], hasLogin: true, role: "PLAYER", managedTeam: null,
  });
  fakeBackend({ [`club-admin/teams/${TEAM}`]: team, "club-admin/players": [member(LEO, "Leo", "Fitzgerald", true), member(MAYA, "Fiona", "Brennan", false)] });
  openSignedIn(`/club-admin/teams/${TEAM}/manager`, MARGARET, <Route path="/club-admin/teams/:teamId/manager" element={<ClubAdminTeamAssignManagerPage />} />);
  const leo = (await screen.findByText("Leo Fitzgerald")).closest("label")!;
  expect(leo.textContent).toContain("Under 18");
  expect((within(leo).getByRole("radio") as HTMLInputElement).disabled).toBe(true);
  const adult = screen.getByText("Fiona Brennan").closest("label")!;
  expect((within(adult).getByRole("radio") as HTMLInputElement).disabled).toBe(false);
});

test("JUNIOR-UI-008: a junior's entry in a season about to start is current, not past", async () => {
  const entry: CompetitionEntry = {
    id: TEAM, competitionId: "comp-junior", name: "Weekend Junior", association: "Waverley Tennis", season: "Summer 2026/27",
    section: "18 & Under", seasonStatus: "UPCOMING", player: { id: LEO, code: "PLR113", name: "Leo Fitzgerald" },
    club: "Glen Waverley Tennis Club", team: "Glen Waverley 18U", format: "Team singles & doubles", nextFixture: null,
  };
  fakeBackend({ "player/competitions": [entry] });
  openAsPlayer("/dashboard/competitions", <CompetitionsPage />, "/dashboard/competitions", "leo.fitzgerald@juniors.example");
  const card = (await screen.findByRole("heading", { name: "Weekend Junior" })).closest("article")!;
  expect(within(card).getByText("UPCOMING ENTRY")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Past seasons" }));
  expect(screen.getByText("No past competition entries are recorded for you.")).toBeTruthy();
});
