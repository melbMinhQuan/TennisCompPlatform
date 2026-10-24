import { matchLightButtonClass } from "../../MatchesUI";

interface EndMembershipDialogProps {
	clubName: string;
	onCancel: () => void;
	onConfirm: () => void;
}

const secondaryButton = matchLightButtonClass;

export default function EndMembershipDialog(props: EndMembershipDialogProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="end-membership-title"
				className="w-full max-w-md rounded-2xl bg-white p-6 text-[#1a3049]"
			>
				<h2
					id="end-membership-title"
					className="text-xl font-bold"
				>
					End membership?
				</h2>

				<p className="mt-3 text-sm text-muted">
					This will mark the {props.clubName} membership as
					inactive on this page only.
					No database changes will be made.
				</p>

				<div className="mt-6 flex flex-wrap gap-3">
					<button
						type="button"
						className={secondaryButton}
						onClick={props.onCancel}
					>
						Cancel
					</button>

					<button
						type="button"
						className="min-h-11 rounded-lg bg-red-600 px-5 font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
						onClick={props.onConfirm}
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
}
