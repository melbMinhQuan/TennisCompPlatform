import { Link, useSearchParams } from "react-router";
import {
  mockFixtures,
  mockResults,
} from "../data/mock-fixtures";
import {
  matchBadgeClass,
  matchButtonClass,
  matchCardClass,
  matchLabelClass,
} from "../components/MatchesUI";

export default function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get("view");
  const isHistory = view === "results" || view === "history";

  function changeView(nextView: "upcoming" | "results") {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", nextView);
    setSearchParams(nextParams);
  }

  const tabClass =
    "min-h-11 flex-1 rounded-lg px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af] min-[768px]:w-44 min-[768px]:flex-none";

  return (
    <div className="space-y-6 text-[#1a3049]">
      <header>
        <h1 className="text-[28px] font-bold leading-tight text-white min-[768px]:text-[32px] min-[768px]:text-[#1a3049]">
          My matches
        </h1>

        <p className="mt-5 text-sm leading-6 text-white/85 min-[768px]:text-[#526579]">
          {isHistory
            ? "Your finalised results across clubs and seasons."
            : "Upcoming team fixtures and your personal match history."}
        </p>
      </header>

      <div
        role="group"
        aria-label="Choose match view"
        className="flex gap-3"
      >
        <button
          type="button"
          aria-pressed={!isHistory}
          onClick={() => changeView("upcoming")}
          className={`${tabClass} ${
            !isHistory
              ? "bg-[#3f72af] text-white"
              : "bg-[#e8f0fa] text-[#1a3049] hover:bg-[#dce8f5]"
          }`}
        >
          Upcoming
        </button>

        <button
          type="button"
          aria-pressed={isHistory}
          onClick={() => changeView("results")}
          className={`${tabClass} ${
            isHistory
              ? "bg-[#3f72af] text-white"
              : "bg-[#e8f0fa] text-[#1a3049] hover:bg-[#dce8f5]"
          }`}
        >
          History
        </button>
      </div>

      <div className="text-sm leading-6 text-white/85 min-[768px]:text-[#526579]">
        <p className="text-xs font-medium uppercase tracking-wide">
          {isHistory
            ? "All seasons · All my clubs"
            : "All my clubs · All my competitions"}
        </p>

        <p className="mt-1">
          {isHistory
            ? "Most recent first."
            : "Times shown in Melbourne time."}
        </p>
      </div>

      <div className="grid gap-6">
        {isHistory
          ? mockResults.map((result) => (
              <article key={result.id} className={matchCardClass}>
                <p className={matchLabelClass}>
                  {result.dateLabel}
                </p>

                <h2 className="mt-4 break-words text-xl font-semibold leading-7">
                  {result.players.join(" & ")}
                  {result.discipline === "Doubles" ? <br /> : " "}
                  <span className="font-normal">vs</span>{" "}
                  {result.opponents.join(" & ")}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#718196]">
                  {result.competition} · {result.discipline}
                </p>

                <p className="mt-1 text-sm leading-6 text-[#718196]">
                  Represented {result.club}
                </p>

                <p
                  aria-label="Match score"
                  className="mt-5 flex flex-wrap gap-4 text-2xl font-semibold tabular-nums"
                >
                  {result.sets.map((set, index) => (
                    <span key={index}>
                      {set.playerGames}–{set.opponentGames}
                    </span>
                  ))}
                </p>

                <div className="mt-3">
                  <span className={matchBadgeClass}>
                    FINALISED
                  </span>
                </div>

                <Link
                  to={`/dashboard/matches/scorecards/${result.id}`}
                  className={`${matchButtonClass} mt-5`}
                >
                  View scorecard
                </Link>
              </article>
            ))
          : mockFixtures.map((fixture) => (
              <article key={fixture.id} className={matchCardClass}>
                <p className={matchLabelClass}>
                  {fixture.dateLabel} · {fixture.timeLabel}
                </p>

                <h2 className="mt-4 break-words text-xl font-semibold leading-7">
                  {fixture.homeTeam} vs {fixture.awayTeam}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#718196]">
                  {fixture.competition} · Round {fixture.round}
                </p>

                <p className={`${matchLabelClass} mt-5`}>
                  Representing
                </p>

                <p className="mt-2 text-base font-semibold">
                  {fixture.club}
                </p>

                <p className="mt-3 text-sm leading-6 text-[#718196]">
                  Team fixture only. Individual player selection is
                  confirmed separately by your team manager.
                </p>

                <Link
                  to={`/dashboard/matches/${fixture.id}`}
                  className={`${matchButtonClass} mt-5`}
                >
                  View fixture
                </Link>
              </article>
            ))}
      </div>
    </div>
  );
}