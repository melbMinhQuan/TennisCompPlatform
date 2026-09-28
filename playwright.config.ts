import { defineConfig, devices } from "@playwright/test";

// End-to-end tests: the real frontend, backend and database, driven in a browser.
// Locally they reuse servers you already have running (npm run dev:*), or start them.
// The database must be running and seeded first: see README "How to run".
const IN_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: IN_CI ? 1 : 0,
  reporter: IN_CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chrome",
      // Locally, the Google Chrome you already have; in CI, Playwright's own Chromium.
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, channel: IN_CI ? undefined : "chrome" },
    },
  ],
  webServer: [
    {
      // Built output, not watch mode, so a test run never rebuilds halfway through.
      command: "npm run build --workspace=backend && node backend/dist/main.js",
      // Answers 400 (no email) once the API is up; Playwright counts 400 as "ready".
      url: "http://localhost:3000/api/v1/player/fixtures",
      reuseExistingServer: !IN_CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev:frontend",
      url: "http://localhost:5173",
      reuseExistingServer: !IN_CI,
      timeout: 60_000,
    },
  ],
});
