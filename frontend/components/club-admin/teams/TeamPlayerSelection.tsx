import { Link } from "react-router";
import type { ClubPlayer } from "../../../api/club-admin-players";
import {
	matchButtonClass,
	matchCardClass,
	matchLightButtonClass,
	pageTitleClass,
} from "../../MatchesUI";
import { displayId } from "../../../utils/formatters";

interface TeamPlayerSelectionProps {
	teamName: string;
	detailPath: string;
	search: string;
	members: {
		player: ClubPlayer;
		eligible: boolean;
		reason: string;
	}[];
	selected: string[];
	error: string;
	busy: boolean;
	onSearchChange: (value: string) => void;
	onTogglePlayer: (id: string) => void;
	onAdd: () => Promise<void>;
}

export default function TeamPlayerSelection(props: TeamPlayerSelectionProps) {
	return (
		<section className="text-white md:text-[#1a3049]">
			<p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">
				Teams / {props.teamName} / Add players
			</p>

			<Link
				to={props.detailPath}
				className={`${matchLightButtonClass} mt-5`}
			>
				‹ Back to team
			</Link>

			<h1 className={`mt-6 ${pageTitleClass}`}>
				Add players
			</h1>

			<p className="mt-3 text-sm text-[#d2dfed] md:text-muted">
				Select eligible club members to add to {props.teamName}.
			</p>

			<div className={`mt-5 text-[#1a3049] ${matchCardClass}`}>
				<label
					htmlFor="team-player-search"
					className="text-sm font-semibold"
				>
					Search players
				</label>

				<input
					id="team-player-search"
					type="search"
					value={props.search}
					onChange={(event) => props.onSearchChange(event.target.value)}
					placeholder="Search by name or Player ID"
					className="mt-2 min-h-11 w-full rounded-lg border border-[#c8d8e9] px-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
				/>

				<div className="mt-5 flex items-center justify-between border-b border-[#dbe4ef] pb-3">
					<h2 className="font-bold">
						Players ({props.members.length})
					</h2>
					<span className="text-sm text-muted">
						{props.selected.length} selected
					</span>
				</div>

				<div className="max-h-[480px] overflow-y-auto">
					{props.members.length === 0 ? (
						<p className="py-6 text-sm text-muted">
							No players found.
						</p>
					) : (
						props.members.map(({ player, eligible, reason }) => (
							<label
								key={player.id}
								className={`flex items-center gap-3 border-b border-[#e4eaf2] py-4 last:border-0 ${
									eligible ? "cursor-pointer" : "opacity-65"
								}`}
							>
								<input
									type="checkbox"
									disabled={!eligible}
									checked={props.selected.includes(player.id)}
									onChange={() => props.onTogglePlayer(player.id)}
									className="h-4 w-4 accent-[#3f72af]"
								/>

								<div className="min-w-0 flex-1">
									<p className="font-semibold">
										{player.firstName} {player.lastName}
									</p>
									<p className="text-xs text-muted">
										{displayId(player)} · {eligible ? "Active member" : reason}
									</p>
								</div>

								<span
									className={`rounded-md px-2 py-1 text-xs font-semibold ${
										eligible
											? "bg-[#e4f5ec] text-[#187650]"
											: "bg-[#fff1df] text-[#a45a15]"
									}`}
								>
									{eligible ? "Eligible" : "Can't add"}
								</span>
							</label>
						))
					)}
				</div>

				{(props.error) && (
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
						disabled={props.selected.length === 0 || props.busy}
						onClick={() => void props.onAdd()}
						className={`${matchButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
					>
						Add {props.selected.length}{" "}
						{props.selected.length === 1 ? "player" : "players"}
					</button>
				</div>
			</div>
		</section>
	);
}
