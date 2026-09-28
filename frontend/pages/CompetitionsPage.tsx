import { Link, useSearchParams } from "react-router";
import { getCompetitions } from "../api/matches";
import { useApiData } from "../api/useApiData";
import { matchBadgeClass, matchButtonClass, matchCardClass, pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";

export default function CompetitionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPast = searchParams.get("view") === "past";
  const { data: competitions, error, retry } = useApiData(getCompetitions);
  if (!competitions) return <MatchLoadState error={error} retry={retry} />;

  const visibleCompetitions = competitions.filter(
    (competition) => isPast ? competition.seasonStatus !== "ACTIVE" : competition.seasonStatus === "ACTIVE",
  );

  const clubCount = new Set(
    visibleCompetitions.map((competition) => competition.club),
  ).size;

  return (
    <div className={pageClass}>
      <header>
        <h1 className={pageTitleClass}>
          My Competitions
        </h1>

        <p className={pageIntroClass}>
          See the club and team you represent in each season.
        </p>
      </header>

      <div role="group" aria-label="Competition seasons" className="flex gap-3">
        {([false, true] as const).map(past => <button key={String(past)} type="button" aria-pressed={isPast === past}
          onClick={() => setSearchParams({ view: past ? "past" : "current" })}
          className={`min-h-11 rounded-lg px-5 py-3 text-sm font-medium ${isPast === past ? "bg-brand text-white" : "bg-[#e8f0fa] text-ink"}`}>
          {past ? "Past seasons" : "Current seasons"}
        </button>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-[#e5f4ec] px-3 py-1.5 text-xs font-semibold text-[#197354]">
          {isPast ? "PAST SEASONS" : "CURRENT SEASONS"}
        </span>

        <p className="text-sm text-white/85 min-[768px]:text-muted">
          {visibleCompetitions.length} competitions · {clubCount} represented clubs
        </p>
      </div>

      {visibleCompetitions.length === 0 && <p className="rounded-2xl bg-white p-6 text-muted">No {isPast ? "past" : "current"} competition entries are recorded for you.</p>}
      <div className="grid gap-6">
        {visibleCompetitions.map((competition) => (
          <article
            key={competition.id}
            className={matchCardClass}
          >
            <h2 className="text-lg font-semibold">
              {competition.name}
            </h2>

            <span className="mt-3 inline-flex rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#197354]">
              {isPast ? "PAST ENTRY" : "ACTIVE ENTRY"}
            </span>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
              Representing
            </p>

            <p className="mt-2 text-base font-semibold">
              {competition.club}
            </p>

            <div className="mt-3 space-y-1 text-sm leading-6 text-muted">
              <p>
                {competition.team} · {competition.section}
              </p>

              <p>
                {competition.association} · {competition.season}
              </p>

              <p>
                {competition.format}
              </p>
            </div>

            <Link
              to={`/dashboard/competitions/${competition.id}`}
              className={`${matchButtonClass} mt-5`}
            >
              View competition
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}