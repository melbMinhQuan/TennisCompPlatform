import { expect, test } from "@playwright/test";
import { logIn } from "../helpers";

// Runs after every release against the live site (playwright.live.config.ts). It proves the whole
// chain: the deployed page calls the backend address baked into it, the backend accepts that origin
// (CORS) and reads the live database. Charlotte rather than Chloe, because the logged-out sample
// profile is also "Chloe Cooper": Charlotte's name can only have come from the live backend.
const CHARLOTTE = "charlotte.reed004@players.example";

test("LIVE-001: a seeded player logs in to the live site and their dashboard loads in full", async ({ page }) => {
  await logIn(page, CHARLOTTE);
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { name: "Charlotte Reed" })).toBeVisible();
  // The fixtures and results cards load separately; each must finish without an error.
  await expect(main.getByRole("status")).toHaveCount(0);
  await expect(main.getByRole("alert")).toHaveCount(0);
});
