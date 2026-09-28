import { expect, type Page } from "@playwright/test";

// Every seeded .example account shares this development password (see README "Logging in").
export const DEV_PASSWORD = "WaverleyDev#2026";
export const CHLOE = "chloe.cooper005@players.example";

/** Logs in through the real form and waits for the dashboard. */
export async function logIn(page: Page, email = CHLOE, password = DEV_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * Opens a page from the sidebar. The login lives only in page memory, so moving around
 * must be by clicking, never page.goto(), or the player is logged out.
 */
export async function openFromMenu(page: Page, label: string) {
  await page.getByRole("navigation", { name: "Player menu" }).getByRole("link", { name: label }).click();
}

/** The dashboard card whose heading is `title`. */
export function card(page: Page, title: string) {
  return page.locator("section", { has: page.getByRole("heading", { name: title, exact: true }) });
}
