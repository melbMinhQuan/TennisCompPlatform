import { describe, expect, test } from "vitest";
import type { Membership, MembershipTeam } from "../api/memberships";
import { currentFirst, membershipDetail, pastLabel, primaryFirst } from "../components/clubs/membership-helpers";

const membership = (changes: Partial<Membership> = {}): Membership =>
  ({ id: "m", isPrimary: false, status: "ACTIVE", startDate: "2025-05-03T00:00:00.000Z", endDate: null, ...changes });
const team = (id: string, seasonStatus: MembershipTeam["seasonStatus"]): MembershipTeam =>
  ({ id, name: id, clubId: "club", competitionName: "Weekend Senior", seasonLabel: "Winter 2026", seasonStatus, sectionName: "Section 1" });

describe("FE-009: club membership lines and order", () => {
  test("an active membership says when it started", () => {
    expect(membershipDetail(membership())).toBe("Member since May 2025 · Active membership");
  });

  test("an end date is shown instead of the status", () => {
    expect(membershipDetail(membership({ endDate: "2026-03-31T00:00:00.000Z" }))).toBe("Member since May 2025 · Ended March 2026");
    expect(membershipDetail(membership({ status: "INACTIVE" }))).toBe("Member since May 2025 · Inactive membership");
  });

  test("missing or unreadable dates are left out rather than shown wrong", () => {
    expect(membershipDetail(membership({ startDate: null }))).toBe("Active membership");
    expect(membershipDetail(membership({ startDate: "unknown", endDate: "unknown" }))).toBe("Active membership");
  });

  test("the month is the one written in the date, whatever the time zone", () => {
    // 00:30 on 1 June in Melbourne is still 31 May in UTC.
    expect(membershipDetail(membership({ startDate: "2025-06-01T00:30:00+10:00" }))).toBe("Member since June 2025 · Active membership");
  });

  test("the primary membership comes first; current-season teams come first and past ones are labelled", () => {
    const memberships = [membership({ id: "second" }), membership({ id: "primary", isPrimary: true })].sort(primaryFirst);
    expect(memberships.map((membership) => membership.id)).toEqual(["primary", "second"]);

    const teams = [team("last-year", "COMPLETED"), team("this-year", "ACTIVE"), team("archived", "ARCHIVED")].sort(currentFirst);
    expect(teams.map((team) => team.id + pastLabel(team))).toEqual(["this-year", "last-year · Past season", "archived · Past season"]);
  });

  test("a season that has not started is coming, not past", () => {
    expect(pastLabel(team("next-summer", "UPCOMING"))).toBe(" · Coming season");
  });
});
