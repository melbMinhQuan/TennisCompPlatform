// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import PlayerSession from "../context/PlayerSession";
import LoginPage from "../pages/LoginPage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The login page inside the app's session provider, with /dashboard as a landing marker. */
function renderLogin() {
  render(
    <PlayerSession>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<p>Dashboard reached</p>} />
        </Routes>
      </MemoryRouter>
    </PlayerSession>,
  );
}

function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

describe("I-UI-001: login form", () => {
  test("a wrong password shows an error and stays on the login page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ result: "login_failed" }))));
    renderLogin();
    submit("chloe@club.example", "wrong");
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Incorrect email or password.");
    expect(screen.queryByText("Dashboard reached")).toBeNull();
  });

  test("a correct password opens the dashboard, sending a normalised email", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ result: "login_success", data: null })),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderLogin();
    submit("  Chloe@Club.EXAMPLE ", "right");
    expect(await screen.findByText("Dashboard reached")).toBeTruthy();
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ email: "chloe@club.example", password: "right" });
  });

  test("an unreachable server says so instead of blaming the password", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    renderLogin();
    submit("chloe@club.example", "right");
    expect((await screen.findByRole("alert")).textContent).not.toMatch(/Incorrect email or password/);
  });
});
