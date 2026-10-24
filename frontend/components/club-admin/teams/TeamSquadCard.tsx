import { Link } from "react-router";
import type { ClubTeamDetail } from "../../../api/club-admin-teams";
import { matchButtonClass } from "../../MatchesUI";
import { displayId } from "../../../utils/formatters";
import JuniorBadge from "../../junior/JuniorBadge";

export interface TeamSquadCardProps {
	teamId: string;
	squadCount: number;
	visibleSquad: ClubTeamDetail["players"];
	managerId: string | null;
	showAll: boolean;
	remaining: number;
	removedPlayerName: string | null;
	error: string;
	onRemovePlayer: (playerId: string) => void;
	onToggleShowAll: () => void;
}

export default function TeamSquadCard(props: TeamSquadCardProps) {
	return (
		<div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-lg font-bold">
					Squad ({props.squadCount})
				</h2>

				<Link
					to={`/club-admin/teams/${props.teamId}/add-players`}
					className={matchButtonClass}
				>
					+ Add players
				</Link>
			</div>

			<div className="mt-4 border-t border-[#dbe4ef]">
				{props.squadCount === 0 ? (
					<p className="py-6 text-sm text-muted">
						No active players in this squad.
					</p>
				) : (
					props.visibleSquad.map((player) => (
						<div
							key={player.id}
							className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe4ef] py-4"
						>
							<div>
								<p className="font-semibold">
									{player.firstName} {player.lastName}
									{player.isJunior && <JuniorBadge />}
								</p>

								<p className="mt-0.5 text-sm text-muted">
									{displayId(player)}
								</p>
							</div>

							<div className="flex items-center gap-3">
								<span className="rounded-md bg-[#e4f5ec] px-2.5 py-1 text-xs font-semibold text-[#187650]">
									In squad
								</span>
								{player.id === props.managerId && (
									<span className="rounded-md bg-[#e8f0fa] px-2.5 py-1 text-xs font-semibold text-[#1a3049]">
										Team manager
									</span>
								)}

								<button
									type="button"
									onClick={() => props.onRemovePlayer(player.id)}
									className="text-sm font-medium text-[#b53b3b] hover:underline focus-visible:outline-2 focus-visible:outline-[#b53b3b]"
								>
									Remove
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{props.squadCount > 3 && (
				<button
					type="button"
					onClick={() => props.onToggleShowAll()}
					className="mt-4 text-sm font-medium text-[#3f72af] hover:underline focus-visible:outline-2 focus-visible:outline-[#3f72af]"
				>
					{props.showAll
						? "Show less"
						: `+ ${props.remaining} more players`}
				</button>
			)}

			{props.removedPlayerName && (
				<p
					role="status"
					className="mt-4 rounded-lg bg-[#e4f5ec] p-3 text-sm text-[#187650]"
				>
					{props.removedPlayerName} was removed from the squad.
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
