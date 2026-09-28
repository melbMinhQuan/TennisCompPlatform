import type { Membership, MembershipTeam, PlayerMemberships } from "../../api/memberships";
import { matchCardClass } from "../MatchesUI";

export type ClubMembership = PlayerMemberships["clubs"][number];

export const CLUB_CARD_CLASS = `${matchCardClass} text-[#1a3049]`;

/** Primary membership first. */
export const primaryFirst = (a: Membership, b: Membership) => Number(b.isPrimary) - Number(a.isPrimary);

/** Current-season teams first; past seasons stay listed but are labelled. */
export const currentFirst = (a: MembershipTeam, b: MembershipTeam) =>
  Number(b.seasonStatus === "ACTIVE") - Number(a.seasonStatus === "ACTIVE");

export const pastLabel = (team: MembershipTeam) => (team.seasonStatus === "ACTIVE" ? "" : " · Past season");

/** "May 2025" from an ISO date, or null. */
function monthYear(value: string | null) {
  const date = value ? new Date(value.slice(0, 10) + "T00:00:00Z") : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" })
    : null;
}

/** "Member since May 2025 · Active membership", or "… · Ended March 2026". */
export function membershipDetail(membership: Membership) {
  const since = monthYear(membership.startDate);
  const ended = monthYear(membership.endDate);
  return (
    (since ? "Member since " + since + " · " : "") +
    (ended ? "Ended " + ended : (membership.status === "ACTIVE" ? "Active" : "Inactive") + " membership")
  );
}
