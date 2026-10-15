// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useContext, type ReactNode } from "react";
import PlayerSession, { PlayerSessionContext } from "../context/PlayerSession";
import { useApiData } from "../api/useApiData";

const ALICE = "alice@club.example";
const BOB = "bob@club.example";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** A promise the test settles by hand, so it decides which answer arrives first. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("I-UI-004: page data follows the logged-in player", () => {
  // useApiData reads the player from the session; the test swaps who is logged in.
  let loggedIn = ALICE;
  function Session({ children }: { children: ReactNode }) {
    const session = { email: loggedIn, setEmail: () => {}, data: null, error: "", loading: false, reload: () => {} };
    return <PlayerSessionContext.Provider value={session}>{children}</PlayerSessionContext.Provider>;
  }

  /** Renders the hook as Alice, recording who was logged in and what data each render returned. */
  function renderAsAlice(load: (signal: AbortSignal, identity?: string) => Promise<string>) {
    loggedIn = ALICE;
    const renders: [string, string | undefined][] = [];
    const hook = renderHook(() => {
      const result = useApiData(load);
      renders.push([loggedIn, result.data]);
      return result;
    }, { wrapper: Session });
    const switchToBob = () => {
      loggedIn = BOB;
      hook.rerender();
    };
    const shownToBob = () => renders.filter(([who]) => who === BOB).map(([, data]) => data);
    return { ...hook, switchToBob, shownToBob };
  }

  /** A loader whose answers the test releases one player at a time. */
  function heldAnswers() {
    const answers: Record<string, ReturnType<typeof deferred<string>>> = { [ALICE]: deferred<string>(), [BOB]: deferred<string>() };
    const load = vi.fn((_signal: AbortSignal, identity?: string) => answers[identity ?? ""].promise);
    return { answers, load };
  }

  test("switching player hides the previous player's data, not even showing it for one render", async () => {
    const { answers, load } = heldAnswers();
    const { result, switchToBob, shownToBob } = renderAsAlice(load);
    await act(async () => answers[ALICE].resolve("Alice's fixtures"));
    expect(result.current.data).toBe("Alice's fixtures");

    switchToBob();
    expect(result.current).toMatchObject({ data: undefined, loading: true });
    expect(shownToBob()).not.toContain("Alice's fixtures");
  });

  test("a slow answer for the previous player, arriving first, is not shown", async () => {
    const { answers, load } = heldAnswers();
    const { result, switchToBob, shownToBob } = renderAsAlice(load);
    switchToBob();
    await act(async () => answers[ALICE].resolve("Alice's fixtures"));
    expect(result.current).toMatchObject({ data: undefined, loading: true });

    await act(async () => answers[BOB].resolve("Bob's fixtures"));
    expect(result.current).toMatchObject({ data: "Bob's fixtures", loading: false });
    expect(shownToBob()).not.toContain("Alice's fixtures");
  });

  test("a slow answer for the previous player, arriving last, does not replace the current one", async () => {
    const { answers, load } = heldAnswers();
    const { result, switchToBob } = renderAsAlice(load);
    switchToBob();
    await act(async () => answers[BOB].resolve("Bob's fixtures"));
    await act(async () => answers[ALICE].resolve("Alice's fixtures"));
    expect(result.current).toMatchObject({ data: "Bob's fixtures", loading: false });
  });

  test("an error offers a retry that loads again", async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new Error("We couldn’t load your fixtures. Please try again."))
      .mockResolvedValueOnce("Alice's fixtures");
    const { result } = renderAsAlice(load);
    await act(async () => {});
    expect(result.current).toMatchObject({ error: "We couldn’t load your fixtures. Please try again.", loading: false });

    await act(async () => result.current.retry());
    expect(result.current).toMatchObject({ data: "Alice's fixtures", error: undefined, loading: false });
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("leaving the page cancels the request", () => {
    let signal: AbortSignal | undefined;
    const { unmount } = renderAsAlice((s) => {
      signal = s;
      return new Promise<string>(() => {});
    });
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});

describe("I-UI-005: the session's profile belongs to whoever logged in last", () => {
  // Every render's [logged-in email, what the session shows], to catch even a brief wrong profile.
  let renders: [string, string][] = [];

  /** Shows what the session holds, with buttons to log in as each player and to retry. */
  function Probe() {
    const { email, data, error, loading, setEmail, reload } = useContext(PlayerSessionContext);
    const state = loading ? "loading" : error ? `error: ${error}` : data ? `profile: ${data.profile.displayName}` : "logged out";
    renders.push([email, state]);
    return (
      <>
        <p data-testid="state">{state}</p>
        <button onClick={() => setEmail(ALICE)}>Alice</button>
        <button onClick={() => setEmail(BOB)}>Bob</button>
        <button onClick={reload}>Try again</button>
      </>
    );
  }
  const state = () => screen.getByTestId("state").textContent;
  const shownToBob = () => renders.filter(([email]) => email === BOB).map(([, shown]) => shown);
  const profile = (displayName: string) => new Response(JSON.stringify({ data: { profile: { displayName } } }));

  /** Renders the session with fetch held: each dashboard request waits until the test answers it. */
  function renderSession() {
    renders = [];
    const pending = new Map<string, ReturnType<typeof deferred<Response>>>();
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      const answer = deferred<Response>();
      pending.set(new URL(url).searchParams.get("email") ?? "", answer);
      return answer.promise;
    }));
    render(<PlayerSession><Probe /></PlayerSession>);
    const answer = (email: string, response: Response) => act(async () => pending.get(email)?.resolve(response));
    const logInAs = (name: "Alice" | "Bob") => fireEvent.click(screen.getByText(name));
    return { answer, logInAs };
  }

  test("logging in as someone else hides the previous profile, not even showing it for one render", async () => {
    const { answer, logInAs } = renderSession();
    expect(state()).toBe("logged out");
    logInAs("Alice");
    await answer(ALICE, profile("Alice One"));
    expect(state()).toBe("profile: Alice One");

    logInAs("Bob");
    expect(state()).toBe("loading");
    await answer(BOB, profile("Bob Two"));
    expect(state()).toBe("profile: Bob Two");
    expect(shownToBob()).not.toContain("profile: Alice One");
  });

  test("a slow profile for the previous login is never shown, whichever answer arrives first", async () => {
    const first = renderSession();
    first.logInAs("Alice");
    first.logInAs("Bob");
    await first.answer(ALICE, profile("Alice One"));
    expect(state()).toBe("loading");
    await first.answer(BOB, profile("Bob Two"));
    expect(state()).toBe("profile: Bob Two");
    cleanup();

    const last = renderSession();
    last.logInAs("Alice");
    last.logInAs("Bob");
    await last.answer(BOB, profile("Bob Two"));
    await last.answer(ALICE, profile("Alice One"));
    expect(state()).toBe("profile: Bob Two");
    expect(shownToBob()).not.toContain("profile: Alice One");
  });

  test("a profile that failed to load (server starting) loads on retry", async () => {
    const { answer, logInAs } = renderSession();
    logInAs("Alice");
    await answer(ALICE, new Response("<!DOCTYPE html>", { status: 503 }));
    expect(state()).toBe("error: We couldn’t reach the server. Please try again in a minute.");

    fireEvent.click(screen.getByText("Try again"));
    expect(state()).toBe("loading");
    await answer(ALICE, profile("Alice One"));
    expect(state()).toBe("profile: Alice One");
  });
});
