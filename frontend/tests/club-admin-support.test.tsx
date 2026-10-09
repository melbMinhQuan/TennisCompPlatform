// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ClubAdminSupportPage from "../pages/ClubAdminSupportPage";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

// Waits for the sample contacts so their "Loading" status is gone before checking the answers' status.
async function renderPage() {
  render(<ClubAdminSupportPage />);
  await screen.findByText("Association · Waverley Tennis");
}

test("searches admin answers and recovers from no matches", async () => {
  await renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Open help search" }));
  const search = screen.getByRole("searchbox", { name: "Search for help" });
  fireEvent.change(search, { target: { value: "confirmed result" } });
  expect(screen.getByText("How do I report a missing or incorrect result?")).toBeTruthy();
  expect(screen.queryByText("How do I create a team for a new season?")).toBeNull();
  fireEvent.change(search, { target: { value: "no-such-answer" } });
  expect(screen.getByRole("status").textContent).toContain("No answers found");
  fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
  expect(screen.getByText("How do I create a team for a new season?")).toBeTruthy();
});

test("changing topic clears a previous search and uses admin topic counts", async () => {
  await renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Open help search" }));
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "password" } });
  fireEvent.click(screen.getByRole("button", { name: /Teams & Squads/ }));
  expect(screen.getByRole("searchbox")).toHaveProperty("value", "");
  expect(screen.getByRole("status").textContent).toBe("3 answers found in Teams & Squads.");
  expect(screen.queryByText("A player can’t log in. How can I help?")).toBeNull();
});

test("Escape closes search, clears the filter and restores keyboard focus", async () => {
  await renderPage();
  const toggle = screen.getByRole("button", { name: "Open help search" });
  fireEvent.click(toggle);
  const search = screen.getByRole("searchbox");
  fireEvent.change(search, { target: { value: "no-such-answer" } });
  fireEvent.keyDown(search, { key: "Escape" });
  expect(screen.queryByRole("searchbox")).toBeNull();
  expect(document.activeElement).toBe(toggle);
  expect(screen.getByRole("status").textContent).toBe("18 answers found.");
});

test("shows the association and club contacts from the sample data", async () => {
  render(<ClubAdminSupportPage />);
  const contacts = await screen.findByRole("complementary", { name: "Who should I contact?" });
  expect(await screen.findByText("Association · Waverley Tennis")).toBeTruthy();
  expect(contacts.textContent).toContain("Raj Mitchell");
  expect(contacts.textContent).toContain("Mia Coleman");
  expect(contacts.textContent).toContain("Your club · Glen Waverley Tennis Club");
  expect(contacts.textContent).not.toContain("Ended");
});
