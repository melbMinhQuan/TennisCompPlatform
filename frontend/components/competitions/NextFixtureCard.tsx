import { Link } from "react-router";
import type { CompetitionEntry } from "../../types/competition";
import { matchButtonClass, matchCardClass } from "../MatchesUI";
import { formatFixtureDate, formatTime } from "../../utils/date-helpers";

/** The team's next fixture in this competition, or a note that none is scheduled. */
export default function NextFixtureCard({ fixture }: { fixture: CompetitionEntry["nextFixture"] }) {
  if (!fixture) {
    return (
      <section className={matchCardClass}>
        <h2 className="text-lg font-semibold">Next team fixture</h2>
        <p className="mt-4 text-sm text-muted">No upcoming fixture is currently available for this competition.</p>
      </section>
    );
  }

  return (
    <section className={matchCardClass}>
      <h2 className="text-lg font-semibold">Next team fixture · Round {fixture.round}</h2>

      <h3 className="mt-5 text-xl font-semibold leading-7">
        {fixture.homeTeam} vs {fixture.awayTeam}
      </h3>

      <p className="mt-3 text-sm leading-6 text-muted">
        {formatFixtureDate(fixture.date)} · {formatTime(fixture.time)} · {fixture.side}
      </p>

      <p className="mt-1 text-sm leading-6 text-muted">{fixture.venue ? fixture.venue : "Venue confirmation pending"}</p>

      <Link to={`/dashboard/matches/${fixture.id}`} className={`${matchButtonClass} mt-5`}>
        View fixture details
      </Link>
    </section>
  );
}
