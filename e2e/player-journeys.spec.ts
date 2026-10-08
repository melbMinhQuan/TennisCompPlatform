import { expect, test } from "@playwright/test";
import { card, CHLOE, logIn, openFromMenu } from "./helpers";

// Runs against the seeded workbook data (backend/prisma/competition_data.xlsx), as
// Chloe Cooper. Only values that do not depend on today's date are checked.

test("E2E-001: log in and see my profile", async ({ page }) => {
  await logIn(page);
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { name: "Chloe Cooper" })).toBeVisible();
  await expect(main).toContainText("Glen Waverley Tennis Club, Mount Waverley Tennis Club, Syndal Tennis Club, Forest Hill Tennis Club");
  await expect(main).toContainText("Current UTR rating");
  await expect(main).toContainText("5.35");
  const career = card(page, "Recent Activity");
  await expect(career).toContainText("59.3%");
  await expect(career).toContainText("Top 72%");
  await expect(career).toContainText("Waverley Tennis adult singles");
});

test("E2E-002: log in with a wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(CHLOE);
  await page.getByLabel(/^password/i).fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert")).toHaveText("Incorrect email or password.");
  await expect(page).toHaveURL(/\/login$/);
});

test("E2E-003: see my notifications and open one", async ({ page }) => {
  await logIn(page);
  const notifications = card(page, "Notifications");
  await expect(notifications.getByRole("listitem")).toHaveCount(3);
  await expect(notifications).toContainText("Sep 26 → Sep 27, 2026");
  await notifications.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/dashboard\/matches\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Fixture Details" })).toBeVisible();
});

test("E2E-004: see my competitions, current and past", async ({ page }) => {
  await logIn(page);
  await openFromMenu(page, "Competitions");
  await expect(page.getByRole("heading", { name: "Weekend Senior" })).toBeVisible();
  await page.getByRole("link", { name: "View competition" }).first().click();
  await expect(page.getByRole("heading", { name: "Your entry" })).toBeVisible();
  await expect(page.locator("#main-content")).toContainText("Mount Waverley A");

  await openFromMenu(page, "Competitions");
  await page.getByRole("button", { name: "Past seasons" }).click();
  await expect(page.getByRole("heading", { name: "Night Tennis" })).toBeVisible();
  await expect(page.locator("#main-content")).toContainText("Glen Waverley A");
});

test("E2E-005: see my fixtures and a scorecard", async ({ page }) => {
  await logIn(page);
  await openFromMenu(page, "Matches");
  await page.getByRole("link", { name: "View fixture" }).first().click();
  await expect(page.getByRole("heading", { name: "Fixture Details" })).toBeVisible();

  await openFromMenu(page, "Matches");
  await page.getByRole("button", { name: "History" }).click();
  // Newest finalised rubber: 29 Aug 2026, singles against Mei Tran, lost 6–7 6–3 1–6.
  await page.getByRole("link", { name: "View scorecard" }).first().click();
  await expect(page.getByRole("heading", { name: "Your Scorecard" })).toBeVisible();
  await expect(page.locator("#main-content")).toContainText("29 AUG 2026 · Weekend Senior · Round 9");
  await expect(page.locator("#main-content")).toContainText("Mei Tran");
});

test("E2E-006: see my clubs and a team roster", async ({ page }) => {
  await logIn(page);
  await openFromMenu(page, "My Clubs & Associations & Teams");
  const main = page.locator("#main-content");
  await expect(main).toContainText(/2\s*associations/i);
  await expect(main).toContainText(/4\s*clubs/i);
  await expect(main).toContainText(/3\s*teams/i);
  await page.getByRole("button", { name: /View Teams/i }).first().click();
  await page.getByRole("link", { name: /View team members|Glen Waverley A|Mount Waverley A/ }).first().click();
  await expect(page.getByRole("heading", { name: "Team Details" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Team members" })).toBeVisible();
  await expect(main.getByText("You", { exact: true })).toBeVisible();
});

test("E2E-007: check standings and my UTR summary", async ({ page }) => {
  await logIn(page);
  await openFromMenu(page, "Standings");
  const main = page.locator("#main-content");
  await expect(main).toContainText("Mount Waverley A");
  await expect(page.getByRole("button", { name: /UTR rankings/i })).toHaveCount(0);
  await expect(main).toContainText("#72 · Waverley Tennis adult singles");
});

test("E2E-008: find who to contact", async ({ page }) => {
  await logIn(page);
  await page.getByRole("link", { name: "Help & Support" }).first().click();
  const contacts = page.getByRole("complementary", { name: "Who should I contact?" });
  await expect(contacts).toContainText("Your team · Mount Waverley A");
  await expect(contacts).toContainText("Yuki Green");
  await expect(contacts).toContainText("Ethan Wright");
  await expect(contacts).toContainText("Mia Coleman");
});

test("E2E-009: preview the site without logging in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator("#main-content").getByRole("heading", { name: "Chloe Cooper" })).toBeVisible();
  await openFromMenu(page, "My Clubs & Associations & Teams");
  await expect(page.locator("#main-content")).toContainText("Chloe Cooper");
});
