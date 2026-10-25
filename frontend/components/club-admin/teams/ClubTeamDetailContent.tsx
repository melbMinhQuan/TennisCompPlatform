import { Link } from "react-router";
import type { ClubTeamDetail } from "../../../api/club-admin-teams";
import { matchLightButtonClass, pageTitleClass } from "../../MatchesUI";
import TeamSquadCard, { type TeamSquadCardProps } from "./TeamSquadCard";
import TeamManagerCard, { type TeamManagerCardProps } from "./TeamManagerCard";
import RemoveTeamPlayerDialog, { type RemoveTeamPlayerDialogProps } from "./RemoveTeamPlayerDialog";
import RemoveTeamManagerDialog, { type RemoveTeamManagerDialogProps } from "./RemoveTeamManagerDialog";

export interface ClubTeamDetailContentProps {
	team: ClubTeamDetail;
	squadCount: number;
	managerName: string | null;
	squad: TeamSquadCardProps;
	manager: TeamManagerCardProps;
	playerDialog: RemoveTeamPlayerDialogProps | null;
	managerDialog: RemoveTeamManagerDialogProps | null;
}

export default function ClubTeamDetailContent(props: ClubTeamDetailContentProps) {
	return (
		<section className="text-white md:text-[#1a3049]">
			<p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">
				Teams&nbsp; / &nbsp;{props.team.name}
			</p>

			<Link
				to="/club-admin/teams"
				className={`${matchLightButtonClass} mt-5`}
			>
				‹ Teams
			</Link>

			<h1 className={`mt-6 ${pageTitleClass}`}>
				{props.team.name}
			</h1>

			<p className="mt-4 text-sm text-[#d2dfed] md:text-base md:text-muted">
				{props.team.competitionName} · {props.team.seasonLabel} · {props.team.sectionName}
				{" · "}
				Team ID {props.team.id}
			</p>

			<div className="mt-5 rounded-2xl bg-[#1c334f] p-5 text-white md:p-6">
				<h2 className="text-lg font-bold">
					Team summary
				</h2>

				<div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
					<div>
						<p className="text-2xl font-bold">
							{props.squadCount}
						</p>
						<p className="text-sm text-[#b8c9dc]">
							Players in squad
						</p>
					</div>

					<div>
						<div>
							<p className="text-xl font-bold">
								{props.managerName ?? "Not assigned"}
							</p>
							<p className="text-sm text-[#b8c9dc]">
								Team manager
							</p>
						</div>
					</div>

					<div>
						<p className="text-xl font-bold">
							{props.team.seasonLabel}
						</p>
						<p className="text-sm text-[#b8c9dc]">
							Season
						</p>
					</div>
				</div>
			</div>

			<TeamSquadCard {...props.squad} />
			{props.playerDialog && <RemoveTeamPlayerDialog {...props.playerDialog} />}
			<TeamManagerCard {...props.manager} />
			{props.managerDialog && <RemoveTeamManagerDialog {...props.managerDialog} />}
		</section>
	);
}
