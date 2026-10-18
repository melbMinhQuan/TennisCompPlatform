import { expect, test } from "@playwright/test";
import { logIn, logInAsClubAdmin, openFromClubAdminMenu } from "../helpers";

// Runs after every release against the live site (playwright.live.config.ts). It proves the whole
// chain: the deployed page calls the backend address baked into it, the backend accepts that origin
// (CORS) and reads the live database. Charlotte rather than Chloe, because the logged-out sample
// profile is also "Chloe Cooper": Charlotte's name can only have come from the live backend.
// Read-only: nothing here changes the live database.
const CHARLOTTE = "charlotte.reed004@players.example";

test("LIVE-001: a seeded player logs in to the live site and their dashboard loads in full", async ({ page }) => {
  await logIn(page, CHARLOTTE);
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { name: "Charlotte Reed" })).toBeVisible();
  // The fixtures and results cards load separately; each must finish without an error.
  await expect(main.getByRole("status")).toHaveCount(0);
  await expect(main.getByRole("alert")).toHaveCount(0);
});

// The club administrator pages have no sample data, so whatever they show came from the live backend.
test("LIVE-002: a seeded club administrator logs in to the live site and their club's pages load", async ({ page }) => {
  await logInAsClubAdmin(page);
  const main = page.locator("#club-admin-main");
  await expect(main.getByRole("heading", { name: "Glen Waverley Tennis Club" })).toBeVisible();
  // Each page has finished loading (no "Loading…") and none shows an error.
  const pages = [
    ["Players", main.getByRole("heading", { name: /^Active players \(\d+\)$/ })],
    ["Teams", main.getByRole("heading", { name: / · \d+ teams?$/ })],
    ["Fixtures & Results", main.getByRole("heading", { name: "Scheduled and postponed fixtures" })],
  ] as const;
  for (const [label, loaded] of pages) {
    await openFromClubAdminMenu(page, label);
    await expect(loaded, label).toBeVisible();
    await expect(main.getByText("Loading…"), label).toHaveCount(0);
    await expect(main.getByRole("alert"), label).toHaveCount(0);
  }
});
