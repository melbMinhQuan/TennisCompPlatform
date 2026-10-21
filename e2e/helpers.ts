import { expect, type Page } from "@playwright/test";

// Every seeded .example account shares this development password (see README "Logging in").
export const DEV_PASSWORD = "WaverleyDev#2026";
export const CHLOE = "chloe.cooper005@players.example";
// Glen Waverley Tennis Club's club administrator (UserRole UR101).
export const MARGARET = "margaret.hayes@admin.example";

/** Fills in the real login form and submits it. */
async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

/** Logs in through the real form and waits for the dashboard. */
export async function logIn(page: Page, email = CHLOE, password = DEV_PASSWORD) {
  await submitLogin(page, email, password);
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Logs in as a club administrator and waits for the club dashboard. */
export async function logInAsClubAdmin(page: Page, email = MARGARET) {
  await submitLogin(page, email, DEV_PASSWORD);
  await expect(page).toHaveURL(/\/club-admin$/);
}

/** Logs in as the association's administrator and waits for the juniors page. */
export async function logInAsAssociationAdmin(page: Page, email: string) {
  await submitLogin(page, email, DEV_PASSWORD);
  await expect(page).toHaveURL(/\/association-admin$/);
}

/**
 * Opens a page from the sidebar. The login lives only in page memory, so moving around
 * must be by clicking, never page.goto(), or the player is logged out.
 */
export async function openFromMenu(page: Page, label: string) {
  await page.getByRole("navigation", { name: "Player menu" }).getByRole("link", { name: label }).click();
}

/** Opens a club administrator page from the sidebar menu. */
export async function openFromClubAdminMenu(page: Page, label: string | RegExp) {
  await page.getByRole("navigation", { name: "Club admin menu" }).getByRole("link", { name: label }).click();
}

/** The dashboard card whose heading is `title`. */
export function card(page: Page, title: string) {
  return page.locator("section", { has: page.getByRole("heading", { name: title, exact: true }) });
}
