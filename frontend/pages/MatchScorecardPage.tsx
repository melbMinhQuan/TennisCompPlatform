import { Link, useParams } from "react-router";
import { mockResults } from "../data/mock-fixtures";
import {
  MatchNotFound,
  matchBadgeClass,
  matchCardClass,
  matchLightButtonClass,
} from "../components/MatchesUI";

export default function MatchScorecardPage() {
  const { resultId } = useParams();

  const result = mockResults.find(
  (result) => result.id === resultId,
);

  if (!result) {
    return (
      <MatchNotFound
        title="Scorecard not found"
        backTo="/dashboard/matches?view=results"
      />
    );
  }

  const playerNames = result.players.join(" & ");
  const opponentNames = result.opponents.join(" & ");

  return (
    <div className="space-y-6 text-[#1a3049]">
      <Link
            to="/dashboard/matches?view=results"
            className={`${matchLightButtonClass} w-full min-[768px]:w-auto`}
      >
            ‹ Match history
      </Link>

      <header>
        <h1 className="text-[28px] font-bold leading-tight text-white min-[768px]:text-[32px] min-[768px]:text-[#1a3049]">
          Your scorecard
        </h1>

        <p className="mt-5 text-sm leading-6 text-white/85 min-[768px]:text-[#526579]">
          {result.dateLabel} · {result.competition} · Round{" "}
          {result.round}
        </p>
      </header>

      <section className={matchCardClass}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">
            {result.discipline}
          </h2>

          <span className={matchBadgeClass}>FINALISED</span>
        </div>

        <h3 className="mt-6 break-words text-2xl font-semibold leading-snug min-[768px]:text-[30px]">
          {playerNames}
          <br />
          <span className="font-normal">vs</span>{" "}
          {opponentNames}
        </h3>

        <p className="mt-4 text-sm leading-6 text-[#718196]">
          {result.club} · {result.team} · {result.section}
        </p>

        <div className="mt-5 overflow-x-auto rounded-lg bg-[#edf3fa]">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Finalised {result.discipline.toLowerCase()} scorecard:
              {" "}{playerNames} versus {opponentNames}
            </caption>

            <thead>
              <tr className="text-xs uppercase tracking-wide text-[#65788d]">
                <th scope="col" className="px-4 pb-2 pt-4 font-medium">
                  Player
                </th>

                {result.sets.map((_, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="whitespace-nowrap px-4 pb-2 pt-4 text-center font-medium"
                  >
                    Set {index + 1}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <th
                  scope="row"
                  className="px-4 py-3 text-sm font-semibold min-[768px]:text-base"
                >
                  {playerNames}
                </th>

                {result.sets.map((set, index) => (
                  <td
                    key={index}
                    className="px-4 py-3 text-center text-xl font-semibold tabular-nums"
                  >
                    {set.playerGames}
                  </td>
                ))}
              </tr>

              <tr>
                <th
                  scope="row"
                  className="px-4 pb-4 pt-3 text-sm font-normal min-[768px]:text-base"
                >
                  {opponentNames}
                </th>

                {result.sets.map((set, index) => (
                  <td
                    key={index}
                    className="px-4 pb-4 pt-3 text-center text-xl tabular-nums"
                  >
                    {set.opponentGames}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#718196]">
          Scores are shown from your side’s perspective.
        </p>

        <p className="mt-2 text-sm leading-6 text-[#718196]">
          This scorecard represents one individual match within a
          team fixture.
        </p>
      </section>

      <section className={matchCardClass}>
        <h2 className="text-lg font-semibold">
          Something looks incorrect?
        </h2>

        <p className="mt-4 text-sm leading-6 text-[#718196]">
          Please contact your club administrator or team manager.
          Result corrections are managed by authorised staff.
        </p>

        <Link
          to="/dashboard/support"
          className={`${matchLightButtonClass} mt-5`}
        >
          Get help
        </Link>
      </section>
    </div>
  );
}