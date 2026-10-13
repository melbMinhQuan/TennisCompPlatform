import type { ClubAdminFixture } from "../../../api/club-admin-fixtures";
import { isOverdue } from "./fixture-labels";

type Badge = { label: string; className: string };

const BLUE = "bg-[#e8f0fa] text-[#1a3049]";
const GREEN = "bg-[#e5f4ec] text-[#197354]";
const AMBER = "bg-[#fff4e5] text-[#8a4b00]";
const RED = "bg-[#fbe9ea] text-[#a12f2f]";
const GREY = "bg-slate-100 text-slate-600";

// Plain-language labels for the database statuses.
const FIXTURE_BADGES: Record<string, Badge> = {
  SCHEDULED: { label: "Scheduled", className: BLUE },
  POSTPONED: { label: "Postponed", className: RED },
  CANCELLED: { label: "Cancelled", className: GREY },
  COMPLETED: { label: "Completed", className: GREEN },
};

const RESULT_BADGES: Record<string, Badge> = {
  FINALISED: { label: "Final", className: GREEN },
  PENDING_CONFIRMATION: { label: "Awaiting confirmation", className: AMBER },
  UNDER_CORRECTION: { label: "Under correction", className: RED },
};

function badgeFor(fixture: ClubAdminFixture, showResult: boolean): Badge {
  if (showResult && fixture.result) {
    return RESULT_BADGES[fixture.result.status] ?? { label: fixture.result.status, className: GREY };
  }
  if (isOverdue(fixture)) return { label: "Result not entered", className: AMBER };
  return FIXTURE_BADGES[fixture.status] ?? { label: fixture.status, className: GREY };
}

type Props = { fixture: ClubAdminFixture; showResult?: boolean };

/** Coloured status label for a fixture, or for its result when `showResult` is set. */
export default function FixtureStatusBadge({ fixture, showResult = false }: Props) {
  const badge = badgeFor(fixture, showResult);
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>;
}
