import { defineConfig, devices } from "@playwright/test";

// The live-site check that runs after every release (deploy-frontend.yml): the deployed site in a
// real browser, against the live backend and database. It starts nothing locally.
//   FRONTEND_URL=https://... npx playwright test --config=playwright.live.config.ts
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) throw new Error("Set FRONTEND_URL to the address of the site to check.");

export default defineConfig({
  testDir: "./e2e/live",
  // The live backend and its database are in different regions, so pages load slower than locally.
  timeout: 60_000,
  expect: { timeout: 20_000 },
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
});
