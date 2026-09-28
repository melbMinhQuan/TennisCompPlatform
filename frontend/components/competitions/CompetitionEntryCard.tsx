import type { CompetitionEntry } from "../../types/competition";
import { matchCardClass, matchLabelClass } from "../MatchesUI";

/** "Your entry": the club and team the player represents in this competition. */
export default function CompetitionEntryCard({ competition }: { competition: CompetitionEntry }) {
  return (
    <section className={matchCardClass}>
      <h2 className="text-lg font-semibold">Your entry</h2>

      <span className="mt-3 inline-flex rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#197354]">
        REGISTERED
      </span>

      <p className={`${matchLabelClass} mt-4`}>Representing</p>
      <p className="mt-2 text-base font-semibold">{competition.club}</p>

      <p className={`${matchLabelClass} mt-5`}>Your team</p>
      <p className="mt-2 text-base font-semibold">{competition.team}</p>

      <p className="mt-3 text-sm leading-6 text-muted">
        Player ID {competition.player.id} · {competition.player.name}
      </p>
    </section>
  );
}
