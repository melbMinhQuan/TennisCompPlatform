import { Link, useParams } from "react-router";
import { getResults } from "../api/matches";
import { useApiData } from "../api/useApiData";
import { matchBadgeClass, matchCardClass, matchLightButtonClass, pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import MatchNotFound from "../components/MatchNotFound";
import { formatResultDate } from "../utils/date-helpers";
import { formatRound } from "../utils/formatters";
import ScorecardTable from "../components/matches/ScorecardTable";

export default function MatchScorecardPage() {
  const { resultId } = useParams();
  const { data: results, error, retry } = useApiData(getResults);
  if (!results) return <MatchLoadState error={error} retry={retry} />;

  const result = results.find((item) => item.id === resultId);
  if (!result) {
    return <MatchNotFound title="Scorecard not found" backTo="/dashboard/matches?view=results" />;
  }

  const playerNames = result.players.join(" & ");
  const opponentNames = result.opponents.join(" & ");

  return (
    <div className={pageClass}>
      <Link to="/dashboard/matches?view=results" className={`${matchLightButtonClass} w-full min-[768px]:w-auto`}>
        ‹ Match history
      </Link>

      <header>
        <h1 className={pageTitleClass}>Your Scorecard</h1>
        <p className={pageIntroClass}>
          {formatResultDate(result.date)} · {result.competition} · {formatRound(result)}
        </p>
      </header>

      <section className={matchCardClass}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">{result.discipline}</h2>
          <span className={matchBadgeClass}>FINALISED</span>
          <span className="text-sm font-semibold">
            {result.result === "W" ? "Won" : result.result === "L" ? "Lost" : "Drawn"}
          </span>
        </div>

        <h3 className="mt-6 break-words text-2xl font-semibold leading-snug min-[768px]:text-[30px]">
          {playerNames}
          <br />
          <span className="font-normal">vs</span> {opponentNames}
        </h3>

        <p className="mt-4 text-sm leading-6 text-muted">
          {result.club} · {result.team} · {result.section}
        </p>

        <ScorecardTable result={result} playerNames={playerNames} opponentNames={opponentNames} />

        <p className="mt-4 text-sm leading-6 text-muted">Scores are shown from your side’s perspective.</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          This scorecard represents one individual match within a team fixture.
        </p>
      </section>

      <section className={matchCardClass}>
        <h2 className="text-lg font-semibold">Something looks incorrect?</h2>
        <p className="mt-4 text-sm leading-6 text-muted">
          Please contact your club administrator or team manager. Result corrections are managed by authorised staff.
        </p>
        <Link to="/dashboard/support" className={`${matchLightButtonClass} mt-5`}>
          Get help
        </Link>
      </section>
    </div>
  );
}
