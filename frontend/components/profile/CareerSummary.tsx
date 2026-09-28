import type { BestUtrRank } from "../../api/dashboard";
import { formatTopPercent } from "../../utils/formatters";

export type CareerSummaryData = {
  matchesPlayed?: number | null;
  winPercentage?: number | null;
  titlesWon?: number | null;
  bestUtrRank?: BestUtrRank | null;
};

const LABEL_CLASS = "min-h-8 text-[12px] font-normal leading-4 text-neutral-500";
const VALUE_CLASS = "mt-2 text-[16px] font-semibold leading-5 text-[#1a3049]";

/** Four career numbers under Recent Activity. A missing value shows "—", not 0. */
export default function CareerSummary({ summary }: { summary?: CareerSummaryData }) {
  const bestRank = summary?.bestUtrRank ?? null;
  const hasBestRank = bestRank !== null;
  return (
    <div className="border-t border-neutral-600 pt-5">
      <h3 className="text-xl font-semibold text-[#1a3049]">Career Summary</h3>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="min-w-0 text-center">
          <p className={LABEL_CLASS}>
            Matches
            <br />
            Played
          </p>
          <p className={VALUE_CLASS}>{summary?.matchesPlayed ?? "—"}</p>
        </div>

        <div className="min-w-0 text-center">
          <p className={LABEL_CLASS}>Win %</p>
          <p className={VALUE_CLASS}>
            {typeof summary?.winPercentage === "number" ? `${summary.winPercentage}%` : "—"}
          </p>
        </div>

        <div className="min-w-0 text-center">
          <p className={LABEL_CLASS}>Titles</p>
          <p className={VALUE_CLASS}>{summary?.titlesWon ?? "—"}</p>
        </div>

        <div className="min-w-0 text-center">
          <p className={LABEL_CLASS}>
            UTR Best
            <br />
            Rank
          </p>
          <p
            className={`mt-2 leading-5 ${hasBestRank ? "text-[16px] font-semibold text-[#1a3049]" : "text-[12px] font-normal text-neutral-500"}`}
          >
            {bestRank ? formatTopPercent(bestRank.percentileRank) : "Not available"}
          </p>
          {/* A percentile only means something next to the group it was measured in. */}
          {bestRank && (
            <p className="mt-1 text-[11px] leading-4 text-neutral-500 [overflow-wrap:anywhere]">
              {bestRank.cohort.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
