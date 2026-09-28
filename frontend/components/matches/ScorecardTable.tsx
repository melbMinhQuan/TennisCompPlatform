import type { MatchResult } from "../../api/matches";

type ScorecardTableProps = { result: MatchResult; playerNames: string; opponentNames: string };

/** Set-by-set scores: the player's side on the first row, the opponents on the second. */
export default function ScorecardTable({ result, playerNames, opponentNames }: ScorecardTableProps) {
  return (
    <div
      className="mt-5 overflow-x-auto rounded-lg bg-[#edf3fa]"
      role="region"
      aria-label="Scorecard, scroll horizontally for all sets"
      tabIndex={0}
    >
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Finalised {result.discipline.toLowerCase()} scorecard: {playerNames} versus {opponentNames}
        </caption>

        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 pb-2 pt-4 font-medium">
              Player
            </th>
            {result.sets.map((_, index) => (
              <th key={index} scope="col" className="whitespace-nowrap px-4 pb-2 pt-4 text-center font-medium">
                Set {index + 1}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr>
            <th scope="row" className="px-4 py-3 text-sm font-semibold min-[768px]:text-base">
              {playerNames}
            </th>
            {result.sets.map((set, index) => (
              <td key={index} className="px-4 py-3 text-center text-xl font-semibold tabular-nums">
                {set.playerGames}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="px-4 pb-4 pt-3 text-sm font-normal min-[768px]:text-base">
              {opponentNames}
            </th>
            {result.sets.map((set, index) => (
              <td key={index} className="px-4 pb-4 pt-3 text-center text-xl tabular-nums">
                {set.opponentGames}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
