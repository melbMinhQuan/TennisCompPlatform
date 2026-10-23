import { Link } from "react-router";
import type { ClubPlayerDetail } from "../../../api/club-admin-players";
import { matchLightButtonClass } from "../../MatchesUI";

interface PlayerTeamsCardProps {
	teams: ClubPlayerDetail["teams"];
}

const secondaryButton = matchLightButtonClass;

export default function PlayerTeamsCard(props: PlayerTeamsCardProps) {
	return (
		<div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
			<h2 className="border-b border-[#dbe4ef] pb-2 text-lg font-bold">
				Teams
			</h2>

			{props.teams.length === 0 ? (
				<p className="py-4 text-sm text-muted">
					No team yet.
				</p>
			) : (
				props.teams.map((team) => (
					<div
						key={team.teamId}
						className="border-b border-[#dbe4ef] py-4 last:border-b-0"
					>
						<p className="font-semibold">{team.teamName}</p>
						<p className="mt-1 text-sm text-muted">
							{team.competitionName} · {team.seasonLabel} · {team.sectionName}
						</p>

						<div className="mt-2 flex flex-wrap items-center gap-3">
							{team.seasonStatus === "ACTIVE" || team.seasonStatus === "UPCOMING" ? (
								<span className="rounded-md bg-[#e4f5ec] px-3 py-1 text-xs font-semibold text-[#187650]">
									In squad
								</span>
							) : (
								<span className="rounded-md bg-[#f0f1f3] px-3 py-1 text-xs font-semibold text-[#64748b]">
									Past season
								</span>
							)}

							<Link
								to={`/club-admin/teams/${team.teamId}`}
								className="text-sm font-semibold text-[#3f72af] hover:underline focus-visible:outline-2 focus-visible:outline-[#3f72af]"
							>
								View team ›
							</Link>
						</div>
					</div>
				))
			)}

			<Link
				to="/club-admin/teams"
				className={`${secondaryButton} mt-4 w-full md:w-auto`}
			>
				+ Add to a team
			</Link>
		</div>
	);
}
