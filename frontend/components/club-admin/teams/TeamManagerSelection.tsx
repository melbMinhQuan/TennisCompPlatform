import { Link } from "react-router";
import type { ClubPlayer } from "../../../api/club-admin-players";
import { matchButtonClass, matchCardClass, matchLightButtonClass } from "../../MatchesUI";
import { displayId } from "../../../utils/formatters";

interface TeamManagerSelectionProps {
	search: string;
	candidates: ClubPlayer[];
	selectedManagerId: string;
	currentManagerId: string | undefined;
	squadPlayerIds: ReadonlySet<string>;
	blockedReason: (player: ClubPlayer) => string;
	error: string;
	assignDisabled: boolean;
	detailPath: string;
	onSearchChange: (value: string) => void;
	onSelectManager: (id: string) => void;
	onAssign: () => Promise<void>;
}

export default function TeamManagerSelection(props: TeamManagerSelectionProps) {
	return (
		<div className={`mt-5 text-[#1a3049] ${matchCardClass}`}>
			<label
				htmlFor="team-manager-search"
				className="text-sm font-semibold"
			>
				Search players
			</label>

			<input
				id="team-manager-search"
				type="search"
				value={props.search}
				onChange={(event) => props.onSearchChange(event.target.value)}
				placeholder="Search by name or Player ID"
				className="mt-2 min-h-11 w-full rounded-lg border border-[#c8d8e9] px-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
			/>

			<div className="mt-5 border-b border-[#dbe4ef] pb-3">
				<h2 className="font-bold">
					Choose one person ({props.candidates.length})
				</h2>
			</div>

			<div className="max-h-[480px] overflow-y-auto">
				{props.candidates.length === 0 ? (
					<p className="py-6 text-sm text-muted">
						No eligible players found.
					</p>
				) : (
					props.candidates.map((player) => {
						const reason = props.blockedReason(player);
						return (
						<label
							key={player.id}
							className={`flex items-center gap-3 border-b border-[#e4eaf2] py-4 last:border-0 ${reason ? "opacity-65" : "cursor-pointer"}`}
						>
							<input
								type="radio"
								name="team-manager"
								disabled={Boolean(reason)}
								value={player.id}
								checked={props.selectedManagerId === player.id}
								onChange={() => props.onSelectManager(player.id)}
								className="h-4 w-4 accent-[#3f72af]"
							/>

							<div className="min-w-0 flex-1">
								<p className="font-semibold">
									{player.firstName} {player.lastName}
								</p>
								<p className="text-xs text-muted">
									{displayId(player)} ·{" "}
									{reason ||
										(props.squadPlayerIds.has(player.id)
											? "In this squad"
											: "Club member")}
								</p>
							</div>

							{player.id === props.currentManagerId && (
								<span className="rounded-md bg-[#e8f0fa] px-2.5 py-1 text-xs font-semibold text-[#1a3049]">
									Current manager
								</span>
							)}
						</label>
						);
					})
				)}
			</div>

			{props.error && (
				<p role="alert" className="mt-4 text-sm text-red-600">
					{props.error}
				</p>
			)}

			<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<Link
					to={props.detailPath}
					className={matchLightButtonClass}
				>
					Cancel
				</Link>

				<button
					type="button"
					disabled={props.assignDisabled}
					onClick={() => void props.onAssign()}
					className={`${matchButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
				>
					Assign manager
				</button>
			</div>
		</div>
	);
}
