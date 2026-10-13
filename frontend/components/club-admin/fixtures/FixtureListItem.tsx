import { Link } from "react-router";
import type { ClubAdminFixture } from "../../../api/club-admin-fixtures";
import { formatFixtureDateWithYear, formatTime } from "../../../utils/date-helpers";
import FixtureStatusBadge from "./FixtureStatusBadge";
import { isOverdue } from "./fixture-labels";

type Props = { fixture: ClubAdminFixture; showResult: boolean };

/** One row in the Fixtures or Results list: teams, status, round, date, venue and a link. */
export default function FixtureListItem({ fixture, showResult }: Props) {
  const { result } = fixture;

  return (
    <li className="border-t border-slate-200 py-4 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">
          {fixture.homeTeam.name} vs {fixture.awayTeam.name}
        </h3>
        <FixtureStatusBadge fixture={fixture} showResult={showResult} />
        {fixture.changed && <span className="text-xs font-semibold text-[#8a4b00]">Schedule changed</span>}
      </div>

      <p className="mt-1 text-sm leading-6 text-muted">
        {fixture.competition} · {fixture.seasonLabel} · {fixture.section} · {fixture.round}
      </p>
      <p className="text-sm leading-6">
        {formatFixtureDateWithYear(fixture.date)} · {formatTime(fixture.time)} · {fixture.venue?.name ?? "Venue to be confirmed"}
      </p>
      {isOverdue(fixture) && (
        <p className="text-sm leading-6 text-[#8a4b00]">This date has passed and no result has been entered yet.</p>
      )}
      {showResult && result && (
        <p className="mt-1 text-sm font-semibold">
          Rubbers {result.homeRubbers ?? "—"}–{result.awayRubbers ?? "—"} (home–away)
        </p>
      )}

      <Link
        to={`/club-admin/fixtures/${fixture.id}`}
        className="mt-1 inline-block text-sm font-medium text-brand underline-offset-4 hover:underline"
      >
        {showResult ? "View result ›" : "View fixture ›"}
      </Link>
    </li>
  );
}
