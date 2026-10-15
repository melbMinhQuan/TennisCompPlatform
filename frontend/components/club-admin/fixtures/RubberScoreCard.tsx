import type { FixtureRubber } from "../../../api/club-admin-fixtures";
import { sentenceCase } from "./fixture-labels";

/** One rubber of a recorded result: players on each side, outcome and set scores (home first). */
export default function RubberScoreCard({ rubber }: { rubber: FixtureRubber }) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold">
        Rubber {rubber.number} · {sentenceCase(rubber.type)}
      </h3>
      <p className="mt-2 text-sm leading-6">
        {rubber.homePlayers.join(" & ") || "Home players unavailable"}
        <span className="block text-muted">vs</span>
        {rubber.awayPlayers.join(" & ") || "Away players unavailable"}
      </p>
      {rubber.outcome !== "COMPLETED" && (
        <p className="mt-2 text-xs font-semibold text-[#8a4b00]">{sentenceCase(rubber.outcome)}</p>
      )}

      {rubber.sets.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-3" aria-label={`Set scores for rubber ${rubber.number}`}>
          {rubber.sets.map((set) => (
            <li key={set.number} className="rounded-lg bg-[#e8f0fa] px-3 py-2 text-sm tabular-nums">
              Set {set.number}: {set.home ?? "—"}–{set.away ?? "—"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No set scores (not played).</p>
      )}
    </article>
  );
}
