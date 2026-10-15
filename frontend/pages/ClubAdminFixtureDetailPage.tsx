import { Link, useParams } from "react-router";
import { getClubAdminFixtures, isClubFixture } from "../api/club-admin-fixtures";
import { useApiData } from "../api/useApiData";
import FixtureStatusBadge from "../components/club-admin/fixtures/FixtureStatusBadge";
import RubberScoreCard from "../components/club-admin/fixtures/RubberScoreCard";
import MatchLoadState from "../components/MatchLoadState";
import { matchCardClass, matchLightButtonClass, pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";
import { formatFixtureDateWithYear, formatTime } from "../utils/date-helpers";

const termClass = "text-xs font-medium uppercase text-muted";

/** One fixture involving the administrator's club, with its scorecard when a result is recorded. */
export default function ClubAdminFixtureDetailPage() {
  const { fixtureId } = useParams();
  const { data, error, retry } = useApiData(getClubAdminFixtures);
  if (!data) return <MatchLoadState error={error} retry={retry} />;

  const fixture = data.find((item) => item.id === fixtureId && isClubFixture(item));
  if (!fixture) {
    return (
      <section className={matchCardClass}>
        <h1 className="text-2xl font-semibold">Fixture not found</h1>
        <p className="mt-3 text-sm text-muted">This fixture is unavailable or does not involve your club.</p>
        <Link to="/club-admin/fixtures" className={`${matchLightButtonClass} mt-4`}>
          Back to fixtures
        </Link>
      </section>
    );
  }

  const { result } = fixture;
  return (
    <div className={pageClass}>
      <Link to={result ? "/club-admin/fixtures?view=results" : "/club-admin/fixtures"} className={matchLightButtonClass}>
        ‹ Fixtures &amp; Results
      </Link>
      <header>
        <h1 className={pageTitleClass}>{result ? "Result details" : "Fixture details"}</h1>
        <p className={pageIntroClass}>
          {fixture.competition} · {fixture.seasonLabel} · {fixture.section} · {fixture.round}
        </p>
      </header>

      <section className={matchCardClass} aria-labelledby="match-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="match-heading" className="text-xl font-semibold">
            {fixture.homeTeam.name} vs {fixture.awayTeam.name}
          </h2>
          <FixtureStatusBadge fixture={fixture} />
          {fixture.changed && <span className="text-xs font-semibold text-[#8a4b00]">Schedule changed</span>}
        </div>
        <p className="mt-2 text-sm text-muted">
          Home: {fixture.homeTeam.name} · Away: {fixture.awayTeam.name}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className={termClass}>Date and time</dt>
            <dd className="mt-1 text-sm">
              {formatFixtureDateWithYear(fixture.date)} · {formatTime(fixture.time)}
              <span className="block text-xs text-muted">Venue local time</span>
            </dd>
          </div>
          <div>
            <dt className={termClass}>Venue</dt>
            <dd className="mt-1 text-sm">
              {fixture.venue?.name ?? "Venue to be confirmed"}
              <span className="block text-muted">{fixture.venue?.address ?? "Address to be confirmed"}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className={matchCardClass} aria-labelledby="score-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="score-heading" className="text-xl font-semibold">
            {result ? "Recorded score" : "No result yet"}
          </h2>
          {result && <FixtureStatusBadge fixture={fixture} showResult />}
        </div>
        {result ? (
          <>
            <p className="mt-3 text-xl font-semibold tabular-nums">
              Rubbers {result.homeRubbers ?? "—"}–{result.awayRubbers ?? "—"}
              <span className="ml-2 text-sm font-normal text-muted">(home–away)</span>
            </p>
            <div className="mt-5 space-y-4">
              {result.rubbers.map((rubber) => (
                <RubberScoreCard key={rubber.id} rubber={rubber} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">No result has been entered for this fixture.</p>
        )}
      </section>

      <section className={matchCardClass}>
        <h2 className="text-lg font-semibold">Something looks incorrect?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Ask the team manager to check the fixture or result. Score corrections and disputes are handled by the
          association administrator.
        </p>
        <Link to="/club-admin/support" className={`${matchLightButtonClass} mt-4`}>
          Get help
        </Link>
      </section>
    </div>
  );
}
