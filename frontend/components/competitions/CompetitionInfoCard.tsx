import type { CompetitionEntry } from "../../types/competition";
import { matchCardClass, matchLabelClass } from "../MatchesUI";

/** "Competition information": season and match format. */
export default function CompetitionInfoCard({ competition }: { competition: CompetitionEntry }) {
  return (
    <section className={matchCardClass}>
      <h2 className="text-lg font-semibold">Competition information</h2>

      <dl className="mt-5 space-y-5">
        <div>
          <dt className={matchLabelClass}>Season</dt>
          <dd className="mt-2 text-base font-semibold">{competition.season}</dd>
        </div>
        <div>
          <dt className={matchLabelClass}>Format</dt>
          <dd className="mt-2 text-base font-semibold">{competition.format}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-6 text-muted">
        Team fixtures contain individual matches, also called rubbers. Your selection for each fixture is confirmed
        separately.
      </p>
    </section>
  );
}
