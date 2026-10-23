import type { ClubPlayerMembership } from "../../../api/club-admin-players";
import { matchLightButtonClass } from "../../MatchesUI";

interface PlayerMembershipDetailsProps {
	clubName: string;
	currentStatus: ClubPlayerMembership["status"];
	isPrimary: boolean;
	primaryClubName: string | undefined;
	joinedDate: string;
	currentTeamCount: number;
	memberships: {
		clubId: string;
		clubName: string;
		status: ClubPlayerMembership["status"];
		isPrimary: boolean;
		joinedLabel: string;
	}[];
	onEndMembership: () => void;
}

const secondaryButton = matchLightButtonClass;

export default function PlayerMembershipDetails(props: PlayerMembershipDetailsProps) {
	return (
		<>
			<div className="mt-5 rounded-2xl bg-[#1c334e] p-5 text-white md:p-6">
					<h2 className="text-lg font-bold">
							{props.clubName} membership
					</h2>

					<div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-[100px_190px_130px_1fr] md:gap-x-5">
							{/* Status */}
							<div>
							<p className="text-xl font-bold">
									{props.currentStatus === "ACTIVE" ? "Active" : "Inactive"}
							</p>
							<p className="text-xs text-[#aebed0]">Status</p>
							</div>

							{/* Club type */}
							<div>
							<p className="text-xl font-bold">
									{props.isPrimary ? "Primary" : "Additional club"}
							</p>
							<p className="text-xs text-[#aebed0]">
									{props.isPrimary
									? "Primary club"
									: `Primary club: ${props.primaryClubName ?? "Unknown"}`}
							</p>
							</div>

							{/* Joined date */}
							<div>
							<p className="text-xl font-bold">
									{props.joinedDate}
							</p>
							<p className="text-xs text-[#aebed0]">Joined</p>
							</div>

							{/* Team count */}
							<div>
							<p className="text-xl font-bold">
									{props.currentTeamCount}
							</p>
							<p className="text-xs text-[#aebed0]">
									{props.currentTeamCount === 1 ? "Team this season" : "Teams this season"}
							</p>
							</div>
					</div>
			</div>


				{/* Club Membership */}
				<div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
					<h2 className="border-b border-[#dbe4ef] pb-2 text-lg font-bold">
						Club membership
					</h2>

					{props.memberships.map((membership) => {
						return (
							<div
								key={membership.clubId}
								className="border-b border-[#dbe4ef] py-4 last:border-b-0"
							>
								<p className="font-semibold">
									{membership.clubName}
								</p>

								<p className="mt-1 text-sm text-muted">
									{membership.joinedLabel}
								</p>

								<div className="mt-2 flex flex-wrap gap-2">
									<span
										className={`rounded-md px-3 py-1 text-xs font-semibold ${
											membership.status === "ACTIVE"
												? "bg-[#e4f5ec] text-[#187650]"
												: "bg-[#f0f1f3] text-[#64748b]"
										}`}
									>
										{membership.status === "ACTIVE" ? "Active" : "Inactive"}
									</span>

									<span className="rounded-md bg-[#e7f0fa] px-3 py-1 text-xs font-semibold">
										{membership.isPrimary
											? "Primary club"
											: "Additional club"}
									</span>
								</div>
							</div>
						);
					})}

					{props.currentStatus === "ACTIVE" && (
						<button
							type="button"
							onClick={props.onEndMembership}
							className={`${secondaryButton} mt-4 w-full md:w-auto`}
						>
							End {props.clubName} membership
						</button>
					)}
				</div>
		</>
	);
}
