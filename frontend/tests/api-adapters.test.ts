import { afterEach, describe, expect, test, vi } from "vitest";
import { getFixtures } from "../api/matches";
import { getTeamDetails } from "../api/teams";
import { getPlayerMemberships } from "../api/memberships";
import { mockFixtures } from "../data/mock-fixtures";

const EMAIL = "chloe@club.example";
const signal = () => new AbortController().signal;

/** Replaces fetch with one canned backend answer and records the URL it was asked for. */
function backendAnswers(status: number, body: unknown) {
  const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("I-FE-001: logged-out visitors get the sample, never a request", () => {
  test("fixtures come from the sample file without calling the backend", async () => {
    const fetchMock = backendAnswers(500, {});
    expect(await getFixtures(signal())).toEqual(mockFixtures);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("I-FE-002: logged-in players always get the backend", () => {
  test("the request names the player and the data is returned as-is", async () => {
    const fetchMock = backendAnswers(200, { data: [{ id: "fx-live" }] });
    expect(await getFixtures(signal(), EMAIL)).toEqual([{ id: "fx-live" }]);
    expect(fetchMock.mock.calls[0][0]).toBe(`http://localhost:3000/api/v1/player/fixtures?email=${encodeURIComponent(EMAIL)}`);
  });

  test("a server error shows a friendly message and never falls back to the sample", async () => {
    backendAnswers(503, { code: "DATA_UNAVAILABLE", message: "password=secret" });
    await expect(getFixtures(signal(), EMAIL)).rejects.toThrow("We couldn’t load your fixtures. Please try again.");
  });

  test("a 404 keeps the server's explanation, e.g. an account with no player", async () => {
    backendAnswers(404, { code: "PLAYER_PROFILE_NOT_LINKED", message: "Login account found, but it does not have a linked player profile yet." });
    await expect(getPlayerMemberships(signal(), EMAIL)).rejects.toThrow(/does not have a linked player profile/);
  });
});

describe("I-FE-003: team details", () => {
  test("someone else's team (404) and a malformed ID (400) both show 'not found'", async () => {
    backendAnswers(404, { code: "TEAM_NOT_FOUND", message: "Team not found" });
    expect(await getTeamDetails("11111111-1111-4111-8111-111111111111", signal(), EMAIL)).toBeNull();
    backendAnswers(400, { message: ["Validation failed (uuid is expected)"] });
    expect(await getTeamDetails("not-a-team", signal(), EMAIL)).toBeNull();
  });
});
