import { Link } from "react-router";
import type { MatchResult } from "../../api/matches";
import { matchBadgeClass, matchButtonClass, matchCardClass, matchLabelClass } from "../MatchesUI";
import { formatResultDate } from "../../utils/date-helpers";

/** One finalised rubber in the player's match history. Scores are from the player's side. */
export default function ResultCard({ result }: { result: MatchResult }) {
  return (
    <article className={matchCardClass}>
      <p className={matchLabelClass}>{formatResultDate(result.date)}</p>

      <h2 className="mt-4 break-words text-xl font-semibold leading-7">
        {result.players.join(" & ")}
        {result.discipline === "Doubles" ? <br /> : " "}
        <span className="font-normal">vs</span> {result.opponents.join(" & ")}
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted">
        {result.competition} · {result.discipline}
      </p>
      <p className="mt-1 text-sm leading-6 text-muted">Represented {result.club}</p>

      <p aria-label="Match score" className="mt-5 flex flex-wrap gap-4 text-2xl font-semibold tabular-nums">
        {result.sets.map((set, index) => (
          <span key={index}>
            {set.playerGames}–{set.opponentGames}
          </span>
        ))}
      </p>

      <div className="mt-3">
        <span className={matchBadgeClass}>FINALISED</span>
      </div>

      <Link to={`/dashboard/matches/scorecards/${result.id}`} className={`${matchButtonClass} mt-5`}>
        View scorecard
      </Link>
    </article>
  );
}
