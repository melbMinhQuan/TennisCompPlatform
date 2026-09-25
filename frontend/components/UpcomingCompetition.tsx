import { Link } from "react-router";

export type UpcomingCompetitionItem = {
  id: string;
  month: string;
  day: string;
  weekday: string;
  name: string;
  event: string;
  location: string;
  time: string;
  status?: string;
};

type UpcomingCompetitionProps = {
  competitions?: UpcomingCompetitionItem[];
};

export default function UpcomingCompetition({
  competitions = [],
}: UpcomingCompetitionProps) {
  const hasCompetitions = competitions.length > 0;

  return (
    <section
      className="flex min-w-0 min-h-[360px] flex-col
        rounded-[32px] bg-white p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-black">
          Upcoming Competition
        </h2>

        {hasCompetitions && (
          <Link
            to="/dashboard/competitions"
            className="text-sm font-medium text-cyan-600
              hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {/* Content */}
      {hasCompetitions ? (
        <div className="mt-4 space-y-3">
          {competitions.slice(0, 3).map((competition) => (
            <div
              key={competition.id}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-3"
            >
              {/* Date */}
              <div
                className="flex w-[74px] shrink-0 flex-col
                          items-center justify-center rounded-xl
                          border border-neutral-200 bg-white px-2 py-2
                          shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <span className="text-[10px] font-semibold tracking-wide text-orange-500">
                  {competition.month}
                </span>

                <span className="my-0.5 text-[26px] font-bold leading-none text-black">
                  {competition.day}
                </span>

                <span className="text-[10px] font-semibold text-black">
                  {competition.weekday}
                </span>
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-4 text-black [overflow-wrap:anywhere]">
                      {competition.name}
                    </p>

                    <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-500 [overflow-wrap:anywhere]">
                      {competition.event}
                    </p>

                    <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-500 [overflow-wrap:anywhere]">
                      Location: {competition.location}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end self-stretch justify-between text-right">
                    {competition.status && (
                      <span
                        className="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {competition.status}
                      </span>
                    )}

                    <p className="mt-auto pt-2 text-[11px] font-semibold text-black">
                      {competition.time}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div
          className="flex flex-1 items-center
            justify-center text-center"
        >
          <div>
            <p className="text-base font-medium text-slate-500">
              No upcoming competitions
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Your upcoming competitions will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Bottom button */}
      <Link
        to="/dashboard/competitions"
        className="mt-5 flex min-h-[44px] items-center
                  justify-center rounded-xl border border-slate-300
                  text-sm font-semibold text-black
                  transition hover:bg-slate-50"
      >
        View full schedule
      </Link>
    </section>
  );
}
