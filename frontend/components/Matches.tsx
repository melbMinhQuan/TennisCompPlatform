import { Link } from "react-router";
import {
  type MockFixture,
  mockResults,
} from "../data/mock-fixtures";

export function FixtureCard({ fixture }: { fixture: MockFixture }) {
  const [weekday, day, month] = fixture.dateLabel.split(" ");

  return (
    <Link
      to={`/dashboard/matches/${fixture.id}`}
      className="flex min-w-0 items-start gap-3 rounded-xl
                border border-[#e2e8f0] bg-white p-3 transition
                hover:bg-slate-50 focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
    >
      <div
        className="flex w-[68px] shrink-0 flex-col items-center rounded-xl border border-neutral-200 bg-white py-2 shadow-sm"
      >
        <span className="text-xs font-semibold text-orange-500">
          {month}
        </span>

        <span className="text-[28px] font-bold leading-8 text-black">
          {day}
        </span>
        
        <span className="text-xs font-semibold text-black">
          {weekday}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#1a3049]">
            {fixture.competition}
          </h3>

          {fixture.status === "Postponed" && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
              Postponed
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          Team fixture · Round {fixture.round}
        </p>
        <p className="text-xs leading-5 text-slate-600">
          {fixture.homeTeam} vs {fixture.awayTeam}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Location: {fixture.venue ?? "To be confirmed"}
        </p>
        <p className="mt-2 text-xs font-semibold text-[#1a3049]">
          {fixture.timeLabel}
        </p>
      </div>
    </Link>
  );
}

export function ResultRows() {
  return (
    <ul className="divide-y divide-[#e2e8f0]">
      {mockResults.map((match) => {
        const score = match.sets
          .map(
            (set) =>
              `${set.playerGames}–${set.opponentGames}`,
          )
          .join(" ");

        return (
          <li key={match.id} className="py-4">
            <p className="mb-2 text-xs text-neutral-500">
              {match.dateLabel}
            </p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
              <span className="font-semibold">
                {match.competition}
              </span>

              <span className="font-semibold">
                Round {match.round}
              </span>

              <span className="text-neutral-500">
                vs
              </span>

              <span className="font-semibold">
                {match.opponents.join(" & ")}
              </span>

              <span
                aria-label={`${
                  match.result === "W" ? "Won" : "Lost"
                }, ${score}`}
                className={`ml-auto rounded-lg px-2 py-1 font-medium ${
                  match.result === "W"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {match.result}, {score}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}