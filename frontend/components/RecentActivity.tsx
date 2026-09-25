import { useState } from "react";
import type { DashboardData } from "../api/dashboard";

type CareerSummaryData = {
  matchesPlayed?: number | null;
  winPercentage?: number | null;
  titlesWon?: number | null;
  bestUtrRank?: number | null;
};

type RecentActivityProps = {
  careerSummary?: CareerSummaryData;
  matches?: DashboardData["recentMatches"]["items"];
  available?: boolean;
};

export default function RecentActivity({
  careerSummary,
  matches = [],
  available = true,
}: RecentActivityProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleMatches = expanded ? matches : matches.slice(0, 3);
  return (
    <section
      className="flex min-w-0 min-h-[360px] flex-col rounded-[32px] bg-white p-6"
    >
      {/* Recent Activity */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-black">
          Recent Activity
        </h2>

        {/* View all */}
        {matches.length > 3 && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="shrink-0 text-sm font-medium text-cyan-600 hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Matches empty state */}
      <div
        className="flex min-h-[150px] items-center justify-center text-center"
      >
        <div className="mt-5 flex-1">
          {!available ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Recent activity is currently unavailable.
            </p>
          ) : visibleMatches.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-medium text-slate-500">No recent matches</p>
              <p className="mt-2 text-sm text-slate-400">
                Your recent match activity will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#e2e8f0]">
              {visibleMatches.map((match) => {
                const date = match.date
                  ? new Date(`${match.date.slice(0, 10)}T00:00:00Z`)
                  : null;

                const dateLabel =
                  date && !Number.isNaN(date.getTime())
                    ? date.toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })
                    : "Date not supplied";

                return (
                  <li key={match.id} className="min-w-0 py-3 text-left">
                    <p className="mb-1 text-[12px] font-normal leading-4 text-neutral-500">
                      {dateLabel}
                    </p>

                    <div
                      className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] leading-5 text-black"
                    >
                      <span className="font-semibold [overflow-wrap:anywhere]">
                        {match.competition.name}
                      </span>

                      {match.round && (
                        <span className="shrink-0 font-semibold">{match.round}</span>
                      )}

                      <span className="shrink-0 font-normal text-neutral-600">
                        vs
                      </span>

                      <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                        {match.opponents
                          .map((opponent) => opponent.name)
                          .join(", ") || "Opponent not supplied"}
                      </span>

                      <span
                        className="ml-auto max-w-full rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium leading-4 text-slate-700 [overflow-wrap:anywhere]"
                      >
                        {match.score || "Score not available"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-600 pt-5">
        <h3 className="text-xl font-semibold text-black">Career Summary</h3>

        {/* Career summary grid */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="min-w-0 text-center">
            <p className="min-h-8 text-[12px] font-normal leading-4 text-neutral-500">
              Matches
              <br />
              Played
            </p>
            <p className="mt-2 text-[16px] font-semibold leading-5 text-black">
              {careerSummary?.matchesPlayed ?? "—"}
            </p>
          </div>

          <div className="min-w-0 text-center">
            <p className="min-h-8 text-[12px] font-normal leading-4 text-neutral-500">
              Win %
            </p>
            <p className="mt-2 text-[16px] font-semibold leading-5 text-black">
              {careerSummary?.winPercentage != null
                ? `${careerSummary.winPercentage}%`
                : "—"}
            </p>
          </div>

          <div className="min-w-0 text-center">
            <p className="min-h-8 text-[12px] font-normal leading-4 text-neutral-500">
              Titles
            </p>
            <p className="mt-2 text-[16px] font-semibold leading-5 text-black">
              {careerSummary?.titlesWon ?? "—"}
            </p>
          </div>

          <div className="min-w-0 text-center">
            <p className="min-h-8 text-[12px] font-normal leading-4 text-neutral-500">
              UTR Best
              <br />
              Rank
            </p>
            <p
              className={`mt-2 leading-5 ${
                careerSummary?.bestUtrRank != null
                  ? "text-[16px] font-semibold text-black"
                  : "text-[12px] font-normal text-neutral-500"
              }`}
            >
              {careerSummary?.bestUtrRank ?? "Not available"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
