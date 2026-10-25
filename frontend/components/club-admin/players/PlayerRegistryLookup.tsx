import type { FormEvent } from "react";
import { Link } from "react-router";
import type { RegistryMatch } from "../../../api/club-admin-players";
import { matchButtonClass, matchCardClass, matchLightButtonClass } from "../../MatchesUI";
import { displayId, shortClubName } from "../../../utils/formatters";
import JuniorBadge from "../../junior/JuniorBadge";
import JuniorNotice from "../../junior/JuniorNotice";

interface PlayerRegistryLookupProps {
	showSearch: boolean;
	showResults: boolean;
	fullName: string;
	dateOfBirth: string;
	email: string;
	results: RegistryMatch[];
	clubName: string;
	error: string;
	actionError: string;
	busy: boolean;
	onFullNameChange: (value: string) => void;
	onDateOfBirthChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onSearch: (event: FormEvent<HTMLFormElement>) => Promise<void>;
	onChoose: (player: RegistryMatch) => Promise<void>;
	onCreateNew: () => void;
}

const button = matchButtonClass;
const secondary = matchLightButtonClass;
const inputStyle = "mt-1 min-h-11 w-full rounded-lg border border-[#c8d8e9] bg-white px-4 text-[#1a3049] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

export default function PlayerRegistryLookup(props: PlayerRegistryLookupProps) {
	return (
		<>
			{props.showSearch && (
				<form onSubmit={props.onSearch} className={`mt-5 text-[#1a3049] ${matchCardClass}`}>
					<h2 className="mb-4 text-lg font-bold">Who are you adding?</h2>
					<div className="grid gap-4 md:grid-cols-3">
						<label className="text-sm font-semibold">Full name *
							<input className={inputStyle} value={props.fullName} onChange={(event) => props.onFullNameChange(event.target.value)} placeholder="Full name" required />
							<span className="mt-1 block text-xs font-normal text-muted">Required</span>
						</label>
						<label className="text-sm font-semibold">Date of birth
							<input
								className={inputStyle}
								type="text"
								inputMode="numeric"
								placeholder="DD/MM/YYYY"
								maxLength={10}
								value={props.dateOfBirth}
								onChange={(event) => {
									const digits = event.target.value
										.replace(/\D/g, "")
										.slice(0, 8);

									let formatted = digits.slice(0, 2);

									if (digits.length > 2) {
										formatted += "/" + digits.slice(2, 4);
									}

									if (digits.length > 4) {
										formatted += "/" + digits.slice(4, 8);
									}

									props.onDateOfBirthChange(formatted);
								}}
							/>

							<span className="mt-1 block text-xs font-normal text-muted">Helps find the right person</span>
						</label>
						<label className="text-sm font-semibold">Email
							<input className={inputStyle} type="email" value={props.email} onChange={(event) => props.onEmailChange(event.target.value)} placeholder="Email address" />
							<span className="mt-1 block text-xs font-normal text-muted">Optional. Only used to find a match</span>
						</label>
					</div>
					<p className="mt-4 text-sm text-muted">Searches every registered player, in every club. Results never show date of birth or contact details.</p>
					{(props.error || props.actionError) && <p role="alert" className="mt-2 text-sm text-red-700">{props.error || props.actionError}</p>}
					<button className={`${button} mt-4 w-full md:w-auto`} type="submit" disabled={props.busy}>{props.busy ? "Searching…" : "Search"}</button>
				</form>
			)}

			{props.showResults && (
				<div className="mt-5">
					<h2 className="mb-4 text-lg font-bold">{props.results.length} results for “{props.fullName.trim()}”</h2>
					{props.actionError && <p role="alert" className="mb-4 rounded-lg bg-white p-3 text-sm text-red-700">{props.actionError}</p>}
					{props.results.some((player) => player.isJunior) && <JuniorNotice audience="registry" className="mb-4" />}
					<div className="space-y-4">
						{props.results.map((player) => {
							const member = player.inThisClub;
							const clubs = player.otherClubs;
							const exact = player.match.name === "exact";
							return (
								<article key={player.id} className="rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
									<div className="flex flex-col-reverse items-start justify-between gap-2 md:flex-row">
										<h3 className="font-bold">{player.firstName} {player.lastName} · {displayId(player)}{player.isJunior && <JuniorBadge />}</h3>
										<span className={`rounded-md px-3 py-1 text-xs font-semibold ${member ? "bg-[#e4f5ec] text-[#187650]" : exact ? "bg-[#e7f0fa]" : "bg-[#fff1df] text-[#a45c14]"}`}>
											{member ? "Already in your club" : exact ? "In another club / Not a member" : "Possible match"}
										</span>
									</div>
									<p className="mt-2 text-sm font-medium">Name {exact ? "✓" : "similar"} {player.match.dateOfBirth !== null && ` · Date of birth ${player.match.dateOfBirth ? "✓" : "×"}`} {player.match.email !== null && ` · Email ${player.match.email ? "✓" : "×"}`}</p>
									<p className="mt-2 text-sm text-muted">{member ? `Already a ${shortClubName(props.clubName)} member. There is nothing to add.` : player.isJunior ? "A junior: where they play is not shown to other clubs. Adding them keeps the same Player ID and history." : clubs.length ? `Plays for ${clubs.join(", ")}. Adding them keeps the same Player ID and history.` : "No current club membership."}</p>
									{member ? (
										<Link to={`/club-admin/players/${player.id}`} className={`${secondary} mt-3 w-full md:w-auto`}>View player</Link>
									) : (
										<button type="button" disabled={props.busy} onClick={() => void props.onChoose(player)} className={`${exact ? button : secondary} mt-3 w-full md:w-auto`}>Add to my club</button>
									)}
								</article>
							);
						})}
					</div>
					<div className="mt-4 rounded-2xl border-2 border-dashed border-[#b7cce3] bg-[#f4f8fc] p-5 text-[#1a3049] md:p-6">
						<h3 className="font-bold">Not in the list?</h3>
						<p className="mt-2 text-sm text-muted">Only create a new player if none of the results above is this person.</p>
						<button type="button" className={`${secondary} mt-3 w-full md:w-auto`} onClick={props.onCreateNew}>Create new player</button>
					</div>
				</div>
			)}
		</>
	);
}
