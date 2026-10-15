import { expect, test, type Page } from "@playwright/test";
import { logIn } from "./helpers";

// The seeded workbook deliberately has two different people called Hiro Mitchell (see its README
// sheet), one of them also at a club in the second association. Logging in as each must show that
// person's own profile, never the other's: nothing may find a player by name.
const HIROS = [
  { email: "hiro.mitchell015@players.example", clubs: ["Pinewood Tennis Club", "Syndal Tennis Club"] },
  { email: "hiro.mitchell026@players.example", clubs: ["Forest Hill Tennis Club", "Mulgrave Tennis Club", "Wheelers Hill Tennis Club"] },
];

/** The value of one "Label: value" row on the dashboard's profile card. */
async function profileDetail(page: Page, label: string) {
  const value = page.locator("#main-content dl > div", { has: page.locator("dt", { hasText: `${label}:` }) }).locator("dd");
  await expect(value).toBeVisible();
  return (await value.textContent()) ?? "";
}

test("E2E-010: two players with the same name each see only their own profile", async ({ page }) => {
  const playerIds = [];
  for (const hiro of HIROS) {
    await logIn(page, hiro.email);
    await expect(page.locator("#main-content").getByRole("heading", { name: "Hiro Mitchell" })).toBeVisible();
    expect((await profileDetail(page, "Clubs")).split(", ").sort(), hiro.email).toEqual(hiro.clubs);
    playerIds.push(await profileDetail(page, "Player ID"));
  }
  expect(playerIds[0]).not.toBe(playerIds[1]);
});
