import { useSearchParams } from "react-router";
import { getFixtures, getResults } from "../api/matches";
import { useApiData } from "../api/useApiData";
import { matchCardClass, pageClass, pageIntroClass, pageTitleClass, tabClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import ResultCard from "../components/matches/ResultCard";
import UpcomingFixtureCard from "../components/matches/UpcomingFixtureCard";

export default function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get("view");
  const isHistory = view === "results" || view === "history";
  const fixtures = useApiData(getFixtures);
  const results = useApiData(getResults);
  const current = isHistory ? results : fixtures;
  const upcoming = (fixtures.data ?? [])
    .filter((fixture) => fixture.status !== "Completed" && fixture.status !== "Cancelled")
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999") || (a.time ?? "").localeCompare(b.time ?? ""));
  const history = [...(results.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const shownCount = isHistory ? history.length : upcoming.length;

  function changeView(nextView: "upcoming" | "results") {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", nextView);
    setSearchParams(nextParams);
  }

  return (
    <div className={pageClass}>
      <header>
        <h1 className={pageTitleClass}>My Matches</h1>
        <p className={pageIntroClass}>
          {isHistory
            ? "Your finalised results across clubs and seasons."
            : "Upcoming team fixtures and your personal match history."}
        </p>
      </header>

      <div role="group" aria-label="Choose match view" className="flex gap-3">
        <button
          type="button"
          aria-pressed={!isHistory}
          onClick={() => changeView("upcoming")}
          className={`${tabClass(!isHistory)} min-[768px]:w-44`}
        >
          Upcoming
        </button>
        <button
          type="button"
          aria-pressed={isHistory}
          onClick={() => changeView("results")}
          className={`${tabClass(isHistory)} min-[768px]:w-44`}
        >
          History
        </button>
      </div>

      <div className="text-sm leading-6 text-white/85 min-[768px]:text-muted">
        <p className="text-xs font-medium uppercase tracking-wide">
          {isHistory ? "All seasons · All my clubs" : "All my clubs · All my competitions"}
        </p>
        <p className="mt-1">{isHistory ? "Most recent first." : "Times shown in Melbourne time."}</p>
      </div>

      {!current.data ? (
        <MatchLoadState error={current.error} retry={current.retry} />
      ) : (
        <div className="grid gap-6">
          {shownCount === 0 && (
            <p className={matchCardClass}>
              {isHistory ? "No finalised match results yet." : "No upcoming team fixtures are scheduled."}
            </p>
          )}
          {isHistory
            ? history.map((result) => <ResultCard key={result.id} result={result} />)
            : upcoming.map((fixture) => <UpcomingFixtureCard key={fixture.id} fixture={fixture} />)}
        </div>
      )}
    </div>
  );
}
