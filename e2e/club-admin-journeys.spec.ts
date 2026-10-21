import { expect, test, type Locator, type Page } from "@playwright/test";
import { CHLOE, logIn, logInAsClubAdmin, openFromClubAdminMenu } from "./helpers";

// The club administrator pages against the seeded workbook data (backend/prisma/competition_data.xlsx).
// The pages have no sample data of their own, so everything they show came from the backend.
const API = "http://localhost:3000";
const KAREN = "karen.whitfield@admin.example"; // Wheelers Hill Tennis Club (UR105)
const ROBERT = "robert.keane@admin.example"; // Burwood Tennis Club (UR108)
// Other tests look at these players, so the change journeys never pick them.
const LEAVE_ALONE = /Hiro Mitchell|Mei Tran|Chloe Cooper/;

const main = (page: Page) => page.locator("#club-admin-main");

test.describe("viewing my club (Margaret Hayes, Glen Waverley)", () => {
  test("E2E-011: a club administrator logs in to their club's dashboard", async ({ page }) => {
    await logInAsClubAdmin(page);
    await expect(main(page).getByRole("heading", { name: "Welcome, Margaret" })).toBeVisible();
    const summary = main(page).locator("section", { has: page.getByRole("heading", { name: "Glen Waverley Tennis Club" }) });
    await expect(summary).toContainText("Waverley Tennis");
    // 26 adults, plus seven juniors and a parent who manages a junior team (see docs/junior-privacy.md).
    await expect(summary.getByRole("link", { name: /Active club members/ })).toContainText("34");
    await expect(page.getByLabel("Showing teams for").locator("option:checked")).toHaveText("Weekend Senior · Winter 2026 · Current");
    const teams = main(page).locator("section", { has: page.getByRole("heading", { name: "Your teams · Winter 2026" }) });
    await expect(teams).toContainText("Manager: Diego Brooks");
    await expect(teams).toContainText("Manager: Ethan Campbell");
    await expect(main(page).locator("section", { has: page.getByRole("heading", { name: "Recent activity" }) }))
      .toContainText("Round 12 · Forest Hill B vs Glen Waverley B");
  });

  test("E2E-012: find a member and open their record, and stay logged in after a reload", async ({ page }) => {
    await logInAsClubAdmin(page);
    await openFromClubAdminMenu(page, "Players");
    await expect(main(page).getByRole("heading", { name: "Active players (34)" })).toBeVisible();
    await page.reload();
    await expect(main(page).getByRole("heading", { name: "Active players (34)" })).toBeVisible();

    await main(page).getByLabel("Search my club’s players").fill("chloe");
    await expect(main(page).getByRole("heading", { name: "Active players (1)" })).toBeVisible();
    await main(page).getByRole("link", { name: "View ›" }).click();
    await expect(main(page).getByRole("heading", { name: "Chloe Cooper", level: 1 })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Glen Waverley membership" })).toBeVisible();
    await expect(main(page)).toContainText("Mount Waverley Tennis Club");
  });

  test("E2E-013: see a team's squad and manager", async ({ page }) => {
    await logInAsClubAdmin(page);
    await openFromClubAdminMenu(page, "Teams");
    await expect(main(page).getByRole("heading", { name: "Winter 2026 · 2 teams" })).toBeVisible();
    await main(page).getByRole("link", { name: "View ›" }).first().click();
    await expect(main(page).getByRole("heading", { name: "Glen Waverley A", level: 1 })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Squad (6)" })).toBeVisible();
    const manager = main(page).locator("div", { has: page.getByRole("heading", { name: "Team manager", exact: true }) }).last();
    await expect(manager).toContainText("Diego Brooks");
    await expect(manager).toContainText("diego.brooks100@players.example");
  });

  test("E2E-014: see my club's fixtures and a recorded result", async ({ page }) => {
    await logInAsClubAdmin(page);
    await openFromClubAdminMenu(page, "Fixtures & Results");
    await expect(main(page).getByRole("heading", { name: "Scheduled and postponed fixtures" })).toBeVisible();
    await main(page).getByRole("button", { name: "Results" }).click();
    // Newest result: 19 Sep 2026, Round 12, Forest Hill B 2–1 Glen Waverley B.
    await main(page).getByRole("link", { name: "View result ›" }).first().click();
    await expect(main(page).getByRole("heading", { name: "Result details" })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Forest Hill B vs Glen Waverley B" })).toBeVisible();
    await expect(main(page)).toContainText("Rubbers 2–1");
  });

  test("E2E-015: check my notices and who to contact", async ({ page }) => {
    await logInAsClubAdmin(page);
    await openFromClubAdminMenu(page, "Notifications");
    // The seed has no notices for club administrators yet (docs/club-admin-notifications.md).
    await expect(main(page).getByRole("button", { name: "All (0)" })).toBeVisible();
    await expect(main(page)).toContainText("You’re all caught up.");
    await page.getByRole("link", { name: "Help & Support" }).click();
    const contacts = page.getByRole("complementary", { name: "Who should I contact?" });
    await expect(contacts).toContainText("Association · Waverley Tennis");
    await expect(contacts).toContainText("Raj Mitchell");
    await expect(contacts).toContainText("Mia Coleman");
    await expect(contacts).toContainText("Your club · Glen Waverley Tennis Club");
  });

  test("E2E-016: a player cannot open the club administrator pages, nor their API", async ({ page, request }) => {
    await logIn(page, CHLOE);
    await page.goto("/club-admin/players");
    await expect(page).toHaveURL(/\/dashboard$/);
    const response = await request.get(`${API}/api/v1/club-admin/players?email=${encodeURIComponent(CHLOE)}`);
    expect(response.status()).toBe(403);
    expect((await response.json()).code).toBe("NOT_CLUB_ADMIN");
  });
});

/** Letters only, different on every run, so names never collide with an earlier run or a retry. */
function uniqueSuffix() {
  return Date.now().toString(26).replace(/\d/g, (digit) => "qrstuvwxyz"[Number(digit)]);
}

/** The rows of a pick list whose checkbox or radio can be chosen, leaving out players other tests use. */
function choosable(page: Page, role: "checkbox" | "radio"): Locator {
  return main(page).locator("label").filter({ has: page.getByRole(role, { disabled: false }) }).filter({ hasNotText: LEAVE_ALONE });
}

async function nameIn(row: Locator) {
  return ((await row.locator("p.font-semibold").textContent()) ?? "").trim();
}

// These change the database. Each run makes its own records with names no other run uses, in clubs
// no other test looks at, and undoes what it can. CI's database is thrown away after the run;
// locally, `npm run seed:competition -- --sync` (in backend/) removes the records left behind.
test.describe("changing my club, saved to the database", () => {
  test("E2E-017: enter a team for next season, pick its squad and manager, then undo them", async ({ page }) => {
    const teamName = `Wheelers Hill E2E ${uniqueSuffix()}`;
    await logInAsClubAdmin(page, KAREN);
    await openFromClubAdminMenu(page, "Teams");
    await main(page).getByRole("link", { name: "+ Create team" }).click();
    // Weekend Junior's next season is open for entries too.
    await page.getByLabel(/^Competition/).selectOption({ label: "Weekend Senior" });
    await expect(page.getByLabel(/^Season/).locator("option:checked")).toHaveText("Summer 2026/27");
    await page.getByLabel(/^Section/).selectOption({ label: "Section 2" });
    await page.getByLabel(/^Name/).fill(teamName);
    await page.getByRole("button", { name: "Create team" }).click();
    await expect(main(page).getByRole("status")).toContainText(`${teamName} is entered in Weekend Senior`);

    await main(page).getByRole("link", { name: "+ Add players" }).click();
    const squad = choosable(page, "checkbox");
    const [first, second] = [await nameIn(squad.nth(0)), await nameIn(squad.nth(1))];
    await squad.nth(0).getByRole("checkbox").check();
    await squad.nth(1).getByRole("checkbox").check();
    await page.getByRole("button", { name: "Add 2 players" }).click();
    await expect(main(page).getByRole("heading", { name: teamName, level: 1 })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Squad (2)" })).toBeVisible();

    await main(page).getByRole("link", { name: "+ Assign manager" }).click();
    const candidate = choosable(page, "radio").first();
    const managerName = await nameIn(candidate);
    await candidate.getByRole("radio").check();
    await page.getByRole("button", { name: "Assign manager" }).click();
    await expect(main(page).getByText("Team manager updated successfully.")).toBeVisible();

    // Saved, not just shown: a fresh load from the database has the same squad and manager.
    await page.reload();
    await expect(main(page).getByRole("heading", { name: "Squad (2)" })).toBeVisible();
    await expect(main(page)).toContainText(managerName);
    await expect(main(page)).toContainText(first);
    await expect(main(page)).toContainText(second);

    await main(page).getByRole("button", { name: "Remove", exact: true }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove player" }).click();
    await expect(main(page).getByRole("heading", { name: "Squad (1)" })).toBeVisible();
    await main(page).getByRole("button", { name: "Remove manager" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove manager" }).click();
    await expect(main(page).getByText("Team manager removed successfully.")).toBeVisible();

    await openFromClubAdminMenu(page, "Teams");
    await main(page).getByRole("button", { name: "Summer 2026/27" }).click();
    // The team's row: its name, and the link to it.
    const row = main(page).locator("div", { has: page.getByText(teamName, { exact: true }) })
      .filter({ has: page.getByRole("link", { name: "View ›" }) }).last();
    await expect(row).toContainText("1 in squad");
    await expect(row).toContainText("No manager");
  });

  test("E2E-018: register a new player, then another club finds them in the registry and adds them", async ({ page }) => {
    const fullName = `Robin Testrun${uniqueSuffix()}`;
    await logInAsClubAdmin(page, KAREN);
    await openFromClubAdminMenu(page, "Players");
    await main(page).getByRole("link", { name: "+ Add a player" }).click();
    await page.getByLabel(/Full name/).fill(fullName);
    await page.getByRole("button", { name: "Search" }).click();
    await main(page).getByRole("button", { name: "Create new player" }).click();
    await page.getByLabel(/Date of birth/).fill("01/02/2003");
    await page.getByLabel(/Gender/).selectOption("FEMALE");
    await page.getByRole("button", { name: "Create player" }).click();
    await expect(main(page).getByRole("heading", { name: `${fullName} is now in Wheelers Hill Tennis Club` })).toBeVisible();
    await main(page).getByRole("link", { name: "Back to players" }).click();
    await main(page).getByLabel("Search my club’s players").fill(fullName);
    await expect(main(page).getByRole("heading", { name: "Active players (1)" })).toBeVisible();

    await page.getByRole("link", { name: "Log out" }).click();
    await logInAsClubAdmin(page, ROBERT);
    await openFromClubAdminMenu(page, "Players");
    await main(page).getByRole("link", { name: "+ Add a player" }).click();
    await page.getByLabel(/Full name/).fill(fullName);
    await page.getByRole("button", { name: "Search" }).click();
    const result = main(page).locator("article", { hasText: fullName });
    await expect(result).toContainText("Plays for Wheelers Hill Tennis Club.");
    await result.getByRole("button", { name: "Add to my club" }).click();
    await expect(main(page).getByRole("heading", { name: `${fullName} is now in Burwood Tennis Club` })).toBeVisible();

    await main(page).getByRole("button", { name: "Add another player" }).click();
    await page.getByLabel(/Full name/).fill(fullName);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(result).toContainText("Already in your club");
    await result.getByRole("link", { name: "View player" }).click();
    await expect(main(page).getByRole("heading", { name: fullName, level: 1 })).toBeVisible();
    await expect(main(page)).toContainText("Primary club: Wheelers Hill Tennis Club");
  });
});
