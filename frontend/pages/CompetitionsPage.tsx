import { Link } from "react-router";
import { competitionMock } from "../data/mock-competitions";

export default function CompetitionsPage() {
  const activeCompetitions = competitionMock.filter(
    (competition) => competition.seasonStatus === "ACTIVE",
  );

  const clubCount = new Set(
    activeCompetitions.map((competition) => competition.club),
  ).size;

  return (
    <div className="space-y-6 text-[#1a3049]">
      <header>
        <h1 className="text-[28px] font-bold leading-tight text-white min-[768px]:text-[32px] min-[768px]:text-[#1a3049]">
          My competitions
        </h1>

        <p className="mt-5 text-sm leading-6 text-white/85 min-[768px]:text-[#526579]">
          See the club and team you represent in each season.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-[#e5f4ec] px-3 py-1.5 text-xs font-semibold text-[#34806a]">
          CURRENT SEASON · WINTER 2026
        </span>

        <p className="text-sm text-white/85 min-[768px]:text-[#718196]">
          {activeCompetitions.length} competitions · {clubCount} represented clubs
        </p>
      </div>

      <div className="grid gap-6">
        {activeCompetitions.map((competition) => (
          <article
            key={competition.id}
            className="min-w-0 rounded-2xl border border-[#dce4ee] bg-white p-5 min-[768px]:p-6"
          >
            <h2 className="text-lg font-semibold">
              {competition.name}
            </h2>

            <span className="mt-3 inline-flex rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#34806a]">
              ACTIVE ENTRY
            </span>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[#718196]">
              Representing
            </p>

            <p className="mt-2 text-base font-semibold">
              {competition.club}
            </p>

            <div className="mt-3 space-y-1 text-sm leading-6 text-[#718196]">
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
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#3f72af] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#315e94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
            >
              View competition
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}