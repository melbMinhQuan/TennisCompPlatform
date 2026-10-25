import { Link } from "react-router";
import type { ClubTeamDetail } from "../../../api/club-admin-teams";
import { matchButtonClass, matchLightButtonClass } from "../../MatchesUI";

export interface TeamManagerCardProps {
	teamId: string;
	manager: ClubTeamDetail["manager"];
	managerUpdated: boolean;
	managerRemoved: boolean;
	error: string;
	onRemoveManager: () => void;
}

export default function TeamManagerCard(props: TeamManagerCardProps) {
	return (
		<div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
			<h2 className="text-lg font-bold">
				Team manager
			</h2>

			{props.manager ? (
				<>
					<div className="mt-4 rounded-xl bg-[#f2f6fb] p-4">
						<p className="text-lg font-semibold">
							{props.manager.name}
						</p>
						<p className="mt-1 text-sm text-muted">
							Player ID: {props.manager.playerCode ?? props.manager.playerId ?? "—"}
						</p>
						<p className="mt-1 text-sm text-muted">
							{props.manager.email}
						</p>
					</div>

					<p className="mt-4 text-sm leading-6 text-muted">
						This manager is assigned to this team only.
					</p>

					<div className="mt-4 flex flex-wrap gap-3">
						<Link
							to={`/club-admin/teams/${props.teamId}/manager`}
							className={matchLightButtonClass}
						>
							Change manager
						</Link>

						<button
							type="button"
							onClick={() => props.onRemoveManager()}
							className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#dfb8b8] px-5 text-sm font-medium text-[#b53b3b] hover:bg-[#fff1f1]"
						>
							Remove manager
						</button>
					</div>
				</>
			) : (
				<>
					<p className="mt-2 text-sm leading-6 text-muted">
						No manager is currently assigned to this team.
						Assign an eligible club member to manage
						the team's squad and match information.
					</p>

					<Link
						to={`/club-admin/teams/${props.teamId}/manager`}
						className={`${matchButtonClass} mt-4`}
					>
						+ Assign manager
					</Link>
				</>
			)}

			{props.managerUpdated && props.manager && (
				<p
					role="status"
					className="mt-4 rounded-lg bg-[#e4f5ec] p-3 text-sm text-[#187650]"
				>
					Team manager updated successfully.
				</p>
			)}

			{props.managerRemoved && (
				<p
					role="status"
					className="mt-4 rounded-lg bg-[#e4f5ec] p-3 text-sm text-[#187650]"
				>
					Team manager removed successfully.
				</p>
			)}

			{props.error && (
				<p role="alert" className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-[#b53b3b]">
					{props.error}
				</p>
			)}
		</div>
	);
}
