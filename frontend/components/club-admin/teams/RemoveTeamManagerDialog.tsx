import { matchLightButtonClass } from "../../MatchesUI";

export interface RemoveTeamManagerDialogProps {
	teamName: string;
	managerName: string | null;
	busy: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export default function RemoveTeamManagerDialog(props: RemoveTeamManagerDialogProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="remove-manager-title"
				aria-describedby="remove-manager-description"
				className="w-full max-w-md rounded-2xl bg-white p-6 text-[#1a3049] shadow-xl"
			>
				<h2
					id="remove-manager-title"
					className="text-xl font-bold"
				>
					Remove team manager?
				</h2>

				<p
					id="remove-manager-description"
					className="mt-3 text-sm leading-6 text-muted"
				>
					Are you sure you want to remove{" "}
					<strong>{props.managerName}</strong> as manager
					of {props.teamName}?
				</p>

				<p className="mt-2 text-sm text-muted">
					This will not remove them from the club
					or from the team squad.
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
						Remove manager
					</button>
				</div>
			</div>
		</div>
	);
}
