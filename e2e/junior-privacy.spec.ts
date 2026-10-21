import { expect, test, type Page } from "@playwright/test";
import { MARGARET, logIn, logInAsAssociationAdmin, logInAsClubAdmin, openFromClubAdminMenu, openFromMenu } from "./helpers";

// Who sees what of a junior (docs/junior-privacy.md), in the browser against the seeded workbook.
// Leo Fitzgerald is a junior at Glen Waverley, in Glen Waverley 18U with Maya Okafor, whose parent
// Adaeze Okafor manages the team. Mount Waverley's administrator is another club's. Read only.
const LEO = {
  email: "leo.fitzgerald@juniors.example", born: "14 Nov 2009", phone: "0414 300 800",
  parent: "Siobhan Fitzgerald", parentEmail: "siobhan.fitzgerald@families.example", parentPhone: "0413 200 700",
};
const MAYA = "maya.okafor@juniors.example";
const ADAEZE = "adaeze.okafor@families.example";
const PETER = "peter.lawson@admin.example"; // Mount Waverley Tennis Club
const RAJ = "raj.mitchell001@players.example"; // Waverley Tennis's administrator

const playerMain = (page: Page) => page.locator("#main-content");
const adminMain = (page: Page) => page.locator("#club-admin-main");

/** Leo's row on Glen Waverley 18U's team page, opened from My Clubs. */
async function leoOnTeamPage(page: Page, from: "club card" | "teams you manage") {
  await openFromMenu(page, "My Clubs & Associations & Teams");
  if (from === "club card") {
    await playerMain(page).getByRole("button", { name: "View Teams for Glen Waverley Tennis Club" }).click();
    await playerMain(page).getByRole("link", { name: /Glen Waverley 18U/ }).click();
  } else {
    await playerMain(page).locator("section", { has: page.getByRole("heading", { name: "Teams you manage" }) })
      .getByRole("link", { name: "Glen Waverley 18U" }).click();
  }
  await expect(playerMain(page).getByRole("heading", { name: "Glen Waverley 18U" })).toBeVisible();
  return playerMain(page).getByRole("listitem").filter({ hasText: "Leo Fitzgerald" });
}

test("E2E-019: a junior, or their parent on the junior's login, sees the junior's own details and who else can", async ({ page }) => {
  await logIn(page, LEO.email);
  const profile = page.getByLabel("Player information");
  await expect(profile).toContainText("You are registered as a junior");
  await expect(profile).toContainText(LEO.phone);
  await expect(profile).toContainText(`${LEO.parent} · ${LEO.parentPhone} · ${LEO.parentEmail}`);
});

test("E2E-020: a teammate sees only the junior's name on the team list", async ({ page }) => {
  await logIn(page, MAYA);
  const leo = await leoOnTeamPage(page, "club card");
  await expect(leo).toHaveText(/Leo Fitzgerald/);
  // No Junior badge (the competition is still called Weekend Junior), and none of Leo's details or his parent's.
  await expect(playerMain(page).getByText("Junior", { exact: true })).toHaveCount(0);
  for (const hidden of [LEO.parent, LEO.parentPhone, LEO.phone, LEO.born]) await expect(playerMain(page)).not.toContainText(hidden);
});

test("E2E-021: the team manager sees each junior's parent contact, but not the junior's own", async ({ page }) => {
  await logIn(page, ADAEZE);
  const leo = await leoOnTeamPage(page, "teams you manage");
  await expect(leo).toContainText("Junior");
  await expect(leo.getByRole("link", { name: LEO.parentPhone })).toBeVisible();
  await expect(leo.getByRole("link", { name: LEO.parentEmail })).toBeVisible();
  await expect(playerMain(page).getByRole("note")).toContainText("As team manager");
  for (const hidden of [LEO.phone, LEO.email, LEO.born]) await expect(playerMain(page)).not.toContainText(hidden);
});

test("E2E-022: the junior's own club administrator sees every detail, parent included", async ({ page }) => {
  await logInAsClubAdmin(page, MARGARET);
  await openFromClubAdminMenu(page, "Players");
  await adminMain(page).getByLabel("Search my club’s players").fill("Leo Fitzgerald");
  await adminMain(page).getByRole("link", { name: "View ›" }).click();
  await expect(adminMain(page).getByRole("heading", { name: /Leo Fitzgerald/, level: 1 })).toContainText("Junior");
  const details = adminMain(page).locator("div", { has: page.getByRole("heading", { name: "Personal details" }) }).last();
  for (const shown of [LEO.born, LEO.email, LEO.phone, LEO.parent, LEO.parentPhone, LEO.parentEmail]) await expect(details).toContainText(shown);
});

test("E2E-023: another club's administrator searching for the junior sees the name and a tick, nothing more", async ({ page }) => {
  await logInAsClubAdmin(page, PETER);
  await openFromClubAdminMenu(page, "Players");
  await adminMain(page).getByRole("link", { name: "+ Add a player" }).click();
  await page.getByLabel(/Full name/).fill("Leo Fitzgerald");
  await page.getByLabel(/Date of birth/).fill("14/11/2009");
  await page.getByPlaceholder("Email address").fill("someone.else@juniors.example");
  await page.getByRole("button", { name: "Search" }).click();
  const result = adminMain(page).locator("article", { has: page.getByRole("heading", { name: /Leo Fitzgerald/, level: 3 }) });
  await expect(result).toContainText("Junior");
  await expect(result).toContainText("Date of birth ✓");
  await expect(result).toContainText("Email ×");
  await expect(adminMain(page).getByRole("note")).toContainText("Juniors from other clubs show their name only");
  for (const hidden of [LEO.phone, LEO.email, LEO.parent, LEO.parentPhone, "Glen Waverley"]) await expect(adminMain(page)).not.toContainText(hidden);
  // Nor can they open the junior's record.
  await openFromClubAdminMenu(page, "Players");
  await adminMain(page).getByLabel("Search my club’s players").fill("Leo");
  await expect(adminMain(page).getByRole("heading", { name: "Active players (0)" })).toBeVisible();
});

test("E2E-024: the association administrator lands on every junior's details, with the age check", async ({ page }) => {
  await logInAsAssociationAdmin(page, RAJ);
  const main = page.locator("#association-admin-main");
  await expect(main.getByRole("heading", { name: "Juniors", level: 1 })).toBeVisible();
  await expect(main).toContainText("10 juniors, 1 outside a section's age limit");
  const leo = main.locator("article", { has: page.getByRole("heading", { name: /Leo Fitzgerald/ }) });
  for (const shown of [LEO.born, LEO.email, LEO.phone, LEO.parentPhone]) await expect(leo).toContainText(shown);
  await expect(leo).toContainText("✓ Eligible: 16 on 31 Oct 2026 (18 and under)");
  await main.getByLabel("Only age problems").check();
  await expect(main.locator("article")).toHaveCount(1);
  await expect(main.locator("article")).toContainText("✗ Too old for 12 & Under: 13 on 31 Oct 2026 (12 and under)");
});
