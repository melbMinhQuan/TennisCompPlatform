import { Link } from "react-router";
import type { MatchFixture } from "../../api/matches";
import { matchButtonClass, matchCardClass, matchLabelClass } from "../MatchesUI";
import { formatFixtureDate, formatTime } from "../../utils/date-helpers";
import { formatRound } from "../../utils/formatters";

/** One upcoming team fixture on the Matches page. */
export default function UpcomingFixtureCard({ fixture }: { fixture: MatchFixture }) {
  return (
    <article className={matchCardClass}>
      <p className={matchLabelClass}>
        {formatFixtureDate(fixture.date)} · {formatTime(fixture.time)}
      </p>

      <h2 className="mt-4 break-words text-xl font-semibold leading-7">
        {fixture.homeTeam} vs {fixture.awayTeam}
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted">
        {fixture.competition} · {formatRound(fixture)} · {fixture.status}
      </p>

      <p className={`${matchLabelClass} mt-5`}>Representing</p>
      <p className="mt-2 text-base font-semibold">{fixture.club}</p>

      <p className="mt-3 text-sm leading-6 text-muted">
        Team fixture only. Individual player selection is confirmed separately by your team manager.
      </p>

      <Link to={`/dashboard/matches/${fixture.id}`} className={`${matchButtonClass} mt-5`}>
        View fixture
      </Link>
    </article>
  );
}
