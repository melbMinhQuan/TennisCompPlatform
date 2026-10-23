import { ageLimitLabel, type AssociationJuniorTeam } from "../../api/association-admin";
import { dayMonthYear as longDate } from "../../utils/formatters";

/** One team's age check: a tick, a cross, or why there is nothing to check. */
export default function AgeCheck({ team }: { team: AssociationJuniorTeam }) {
	const limit = ageLimitLabel(team);
	if (team.eligible === null) {
		return <span className="text-sm text-muted">{limit ? "Season start date not set, so age cannot be checked" : "No age limit"}</span>;
	}
	const on = `${team.ageOnSeasonStart} on ${longDate(team.seasonStart!)}`;
	if (team.eligible) return <span className="text-sm font-medium text-[#187650]">✓ Eligible: {on} ({limit})</span>;
	const tooOld = team.maxAge !== null && team.ageOnSeasonStart! > team.maxAge;
	return (
		<span className="text-sm font-semibold text-[#b42318]">
			✗ Too {tooOld ? "old" : "young"} for {team.sectionName}: {on} ({limit})
		</span>
	);
}
