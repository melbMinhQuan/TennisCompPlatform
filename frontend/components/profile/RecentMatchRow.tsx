import type { MatchResult } from "../../api/matches";
import { formatResultDate } from "../../utils/date-helpers";
import { formatRound } from "../../utils/formatters";

/** One line in Recent Activity: date, competition, round, opponents, and "W, 6–3 6–0". */
export default function RecentMatchRow({ match }: { match: MatchResult }) {
  const score = match.sets.map((set) => `${set.playerGames}–${set.opponentGames}`).join(" ");
  const resultClass =
    match.result === "W"
      ? "bg-green-100 text-green-700"
      : match.result === "L"
        ? "bg-red-100 text-red-700"
        : "bg-slate-100 text-slate-700";

  return (
    <li className="min-w-0 py-3 text-left">
      <p className="mb-1 text-[12px] font-normal leading-4 text-neutral-500">{formatResultDate(match.date)}</p>

      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] leading-5 text-[#1a3049]">
        <span className="font-semibold [overflow-wrap:anywhere]">{match.competition}</span>
        <span className="shrink-0 font-semibold">{formatRound(match)}</span>
        <span className="shrink-0 font-normal text-neutral-600">vs</span>
        <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">{match.opponents.join(" & ")}</span>

        <div className="ml-auto flex items-center gap-2">
          <span className={`ml-auto rounded-lg px-3 py-1 text-[11px] font-semibold leading-4 ${resultClass}`}>
            {match.result}, {score}
          </span>
        </div>
      </div>
    </li>
  );
}
