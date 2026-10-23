import { matchLightButtonClass } from "../../MatchesUI";

export interface RemoveTeamPlayerDialogProps {
	teamName: string;
	playerName: string;
	busy: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export default function RemoveTeamPlayerDialog(props: RemoveTeamPlayerDialogProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="remove-player-title"
				aria-describedby="remove-player-description"
				className="w-full max-w-md rounded-2xl bg-white p-6 text-[#1a3049] shadow-xl"
			>
				<h2
					id="remove-player-title"
					className="text-xl font-bold"
				>
					Remove player from squad?
				</h2>

				<p
					id="remove-player-description"
					className="mt-3 text-sm leading-6 text-muted"
				>
					Remove{" "}
					<strong>
						{props.playerName}
					</strong>{" "}
					from {props.teamName}? This will not end their club
					membership.
				</p>

				<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={props.onCancel}
						className={matchLightButtonClass}
					>
						Cancel
					</button>

					<button
						type="button"
						disabled={props.busy}
						onClick={props.onConfirm}
						className="min-h-11 rounded-lg bg-[#b53b3b] px-5 text-sm font-medium text-white hover:bg-[#963030]"
					>
						Remove player
					</button>
				</div>
			</div>
		</div>
	);
}
