import { useState } from "react";
import type { MatchResult } from "../api/matches";
import CareerSummary, { type CareerSummaryData } from "./profile/CareerSummary";
import RecentMatchRow from "./profile/RecentMatchRow";

type RecentActivityProps = {
  careerSummary?: CareerSummaryData;
  matches?: MatchResult[];
  available?: boolean;
};

/** Profile card: the player's last few results (3, or all with "Show more") and their career summary. */
export default function RecentActivity({ careerSummary, matches = [], available = true }: RecentActivityProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleMatches = expanded ? matches : matches.slice(0, 3);
  return (
    <section className="flex min-w-0 min-h-[360px] flex-col rounded-2xl bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[#1a3049]">Recent Activity</h2>

        {matches.length > 3 && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="shrink-0 text-sm font-medium text-[#075bc5] hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      <div className="flex min-h-[150px] items-center justify-center text-center">
        <div className="mt-5 flex-1">
          {!available ? (
            <p className="py-8 text-center text-sm text-slate-500">Recent activity is currently unavailable.</p>
          ) : visibleMatches.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-medium text-slate-500">No recent matches</p>
              <p className="mt-2 text-sm text-slate-500">Your recent match activity will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#e2e8f0]">
              {visibleMatches.map((match) => (
                <RecentMatchRow key={match.id} match={match} />
              ))}
            </ul>
          )}
        </div>
      </div>

      <CareerSummary summary={careerSummary} />
    </section>
  );
}
