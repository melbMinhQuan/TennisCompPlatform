import type { ClubAdminFixture } from "../../../api/club-admin-fixtures";
import { todayInMelbourne } from "../../../utils/date-helpers";

/** A scheduled fixture whose date has passed but has no result yet. */
export function isOverdue(fixture: ClubAdminFixture) {
  return fixture.status === "SCHEDULED" && !fixture.result && fixture.date !== null && fixture.date < todayInMelbourne();
}

/** "Doubles", "Forfeit": database words in sentence case. */
export function sentenceCase(value: string) {
  const words = value.replaceAll("_", " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
