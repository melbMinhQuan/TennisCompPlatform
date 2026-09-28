import { Link, useParams } from "react-router";
import { getFixtures } from "../api/matches";
import { useApiData } from "../api/useApiData";
import { matchCardClass, matchLabelClass, matchLightButtonClass, darkCardClass, pageClass, pageTitleClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import MatchNotFound from "../components/MatchNotFound";
import { formatFixtureDate, formatTime } from "../utils/date-helpers";

export default function MatchFixturePage() {
  const { fixtureId } = useParams();
  const { data: fixtures, error, retry } = useApiData(getFixtures);
  if (!fixtures) return <MatchLoadState error={error} retry={retry} />;

  const fixture = fixtures.find(
  (fixture) => fixture.id === fixtureId,
);

  if (!fixture) {
    return (
      <MatchNotFound
        title="Fixture not found"
        backTo="/dashboard/matches"
      />
    );
  }

  return (
    <div className={pageClass}>
      <Link
        to="/dashboard/matches?view=upcoming"
        className={`${matchLightButtonClass} w-full min-[768px]:w-auto`}
      >
        ‹ Upcoming matches
      </Link>

      <header>
        <h1 className={pageTitleClass}>
          Fixture Details
        </h1>
      </header>

      <section className={darkCardClass}>
        <p className="text-sm text-white/80">
          {fixture.competition} · Round {fixture.round}
        </p>

        <h2 className="mt-5 break-words text-2xl font-semibold leading-snug min-[768px]:text-[30px]">
          {fixture.homeTeam}
          <br />
          <span className="font-normal">vs</span>{" "}
          {fixture.awayTeam}
        </h2>

        <p className="mt-5 text-sm leading-6">
          {formatFixtureDate(fixture.date)} · {formatTime(fixture.time)}
        </p>

        <p className="mt-1 text-sm text-white/75">
            Melbourne time · {fixture.status}
        </p>
      </section>

      <div className="grid items-start gap-5 min-[1100px]:grid-cols-2">
        <section className={matchCardClass}>
          <h2 className="text-lg font-semibold">
            Your participation
          </h2>

          <p className={`${matchLabelClass} mt-5`}>
            Representing
          </p>

          <p className="mt-2 text-base font-semibold">
            {fixture.club}
          </p>

          <p className="mt-3 text-sm leading-6 text-muted">
            {fixture.team} · {fixture.side}
          </p>

          <p className="mt-4 text-sm leading-6 text-muted">
            This fixture is listed because you belong to this team.
            Your individual match selection is confirmed separately
            by your team manager.
          </p>
        </section>

        <section className={matchCardClass}>
            <h2 className="text-lg font-semibold">
                Where to play
            </h2>

          {fixture.venue ? (
            <>
              <p className="mt-5 text-base font-semibold">
                {fixture.venue}
              </p>

              <p className="mt-3 text-sm leading-6 text-muted">
                {fixture.address || "Address not supplied."}
              </p>
            </>
          ) : (
            <>
              <p className="mt-5 text-base font-semibold">
                Venue details pending
              </p>

              <p className="mt-3 text-sm leading-6 text-muted">
                The venue has not been confirmed yet. Please check
                with your team manager before travelling.
              </p>
            </>
          )}
        </section>
      </div>

      <section className={matchCardClass}>
        <h2 className="text-lg font-semibold">
          Match information
        </h2>

        
        <p className="mt-4 text-sm leading-6 text-muted">
            {fixture.association} · {fixture.season} · {fixture.section}
        </p>

        <p className="text-sm leading-6 text-muted">
            {fixture.format} · {fixture.status === "Cancelled" ? "Fixture cancelled" : fixture.status === "Completed" ? "Fixture completed" : "Result not yet available"}
        </p>

        <Link
            to={`/dashboard/competitions/${fixture.competitionEntryId}`}
            className={`${matchLightButtonClass} mt-5`}
        >
            View competition
        </Link>
      </section>
    </div>
  );
}