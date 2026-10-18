import { useContext, useState } from "react";
import { Link } from "react-router";
import {
  addClubMember,
  createClubPlayer,
  searchRegistry,
  type ClubPlayerDetail,
  type NewPlayerDetails,
  type RegistryMatch,
} from "../api/club-admin-players";
import { useClubAdminAction } from "../api/useClubAdminAction";
import { RoleSessionContext } from "../context/RoleSession";
import {
  matchButtonClass,
  matchCardClass,
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";
import CreatePlayerForm from "../components/club-admin/players/CreatePlayerForm";
import { shortClubName } from "../utils/formatters";

type Stage = "search" | "choose" | "create" | "done";
const button = matchButtonClass;
const secondary = matchLightButtonClass;
const inputStyle = "mt-1 min-h-11 w-full rounded-lg border border-[#c8d8e9] bg-white px-4 text-[#1a3049] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

function toISODate(value: string) {
  if (!value.trim()) return "";

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

export default function ClubAdminAddPlayerPage() {
  const [stage, setStage] = useState<Stage>("search");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<RegistryMatch[]>([]);
  const [selected, setSelected] = useState<ClubPlayerDetail | null>(null);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  // The registry search, "Add to my club" and "Create new player" all go to the backend.
  const action = useClubAdminAction();
  const clubName = useContext(RoleSessionContext).signedIn?.clubName ?? "your club";

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim()) {
      setError("Please enter a full name.");
      return;
    }

    if (dateOfBirth.trim() && !toISODate(dateOfBirth)) {
      setError("Please enter a valid date in DD/MM/YYYY format.");
      return;
    }

    setError("");
    const found = await action.run((admin, signal) =>
      searchRegistry({ name: fullName.trim(), dateOfBirth: toISODate(dateOfBirth), playerEmail: normalize(email) }, admin, signal),
    );
    if (!found) return;
    setResults(found);
    setStage("choose");
  }

  /** Makes a registered player a member of the club from today, keeping their Player ID. */
  async function choose(player: RegistryMatch) {
    const member = await action.run((admin, signal) => addClubMember(player.id, admin, signal));
    if (!member) return;
    setSelected(member);
    setCreated(false);
    setStage("done");
  }

  /**
   * Registers someone new (POST /api/v1/club-admin/players). A player with the same name (ignoring
   * case) and date of birth is a possible duplicate, so the admin is asked to add that player instead.
   */
  async function createPlayer(details: NewPlayerDetails) {
    const player = await action.run(
      (admin, signal) => createClubPlayer(details, admin, signal),
      (refusal) => refusal.code === "POSSIBLE_DUPLICATE"
        ? `${details.firstName} ${details.lastName} (${String(refusal.body?.playerId ?? "")}) already has a record with this date of birth. Go back to the results and add that player instead.`
        : null,
    );
    if (!player) return;
    setSelected(player);
    setCreated(true);
    setStage("done");
  }

  function reset() {
    setStage("search"); setFullName(""); setDateOfBirth(""); setEmail("");
    setResults([]); setSelected(null); setCreated(false); setError(""); action.clearError();
  }

  return (
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">Players / Add a player</p>
      {stage !== "done" && (
        <button type="button" onClick={() => { action.clearError(); if (stage === "choose") setStage("search"); else if (stage === "create") setStage("choose"); else window.history.back(); }}
          className={`${secondary} mt-5`}>
          ‹ {stage === "choose" ? "Change search" : stage === "create" ? "Back to results" : "Players"}
        </button>
      )}
      <h1 className={`mt-5 ${pageTitleClass}`}>Add a player</h1>
      <p className="mt-4 text-sm text-[#d2dfed] md:text-muted">
        {stage === "search" ? "First we check if this person is already in the system, so nobody is entered twice."
          : stage === "choose" ? "Pick the person you mean. Each result tells you what will happen."
          : stage === "create" ? "Nobody in the results is this person, so enter their details to create a new player record."
          : "All done. Here's what happened and what you can do next."}
      </p>
      <ol className="mt-5 flex flex-wrap items-center gap-2 text-sm" aria-label="Add player progress">
        {(["Search", "Choose", "Done"] as const).map((label, index) => {
          // Creating a new player is part of the Choose step.
          const current = ["search", "choose", "done"].indexOf(stage === "create" ? "choose" : stage);
          return (
            <li key={label} className="flex items-center gap-2">
              {index > 0 && <span className="mr-1 text-[#a9bdd4]">—</span>}
              <span className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${index < current ? "bg-[#187b5a] text-white" : index === current ? "bg-[#3f72af] text-white" : "bg-[#e8f0fa] text-[#526579]"}`}>
                {index < current ? "✓" : index + 1}
              </span>
              <span className={index === current ? "font-bold" : "opacity-80"}>{label}</span>
            </li>
          );
        })}
      </ol>

      {stage === "search" && (
        <form onSubmit={search} className={`mt-5 text-[#1a3049] ${matchCardClass}`}>
          <h2 className="mb-4 text-lg font-bold">Who are you adding?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold">Full name *
              <input className={inputStyle} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" required />
              <span className="mt-1 block text-xs font-normal text-muted">Required</span>
            </label>
            <label className="text-sm font-semibold">Date of birth
              <input
                className={inputStyle}
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={dateOfBirth}
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

                  setDateOfBirth(formatted);
                }}
              />

              <span className="mt-1 block text-xs font-normal text-muted">Helps find the right person</span>
            </label>
            <label className="text-sm font-semibold">Email
              <input className={inputStyle} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
              <span className="mt-1 block text-xs font-normal text-muted">Optional. Only used to find a match</span>
            </label>
          </div>
          <p className="mt-4 text-sm text-muted">Searches every registered player, in every club. Results never show date of birth or contact details.</p>
          {(error || action.error) && <p role="alert" className="mt-2 text-sm text-red-700">{error || action.error}</p>}
          <button className={`${button} mt-4 w-full md:w-auto`} type="submit" disabled={action.busy}>{action.busy ? "Searching…" : "Search"}</button>
        </form>
      )}

      {stage === "choose" && (
        <div className="mt-5">
          <h2 className="mb-4 text-lg font-bold">{results.length} results for “{fullName.trim()}”</h2>
          {action.error && <p role="alert" className="mb-4 rounded-lg bg-white p-3 text-sm text-red-700">{action.error}</p>}
          <div className="space-y-4">
            {results.map((player) => {
              const member = player.inThisClub;
              const clubs = player.otherClubs;
              const exact = player.match.name === "exact";
              return (
                <article key={player.id} className="rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
                  <div className="flex flex-col-reverse items-start justify-between gap-2 md:flex-row">
                    <h3 className="font-bold">{player.firstName} {player.lastName} · {player.id}</h3>
                    <span className={`rounded-md px-3 py-1 text-xs font-semibold ${member ? "bg-[#e4f5ec] text-[#187650]" : exact ? "bg-[#e7f0fa]" : "bg-[#fff1df] text-[#a45c14]"}`}>
                      {member ? "Already in your club" : exact ? "In another club / Not a member" : "Possible match"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">Name {exact ? "✓" : "similar"} {player.match.dateOfBirth !== null && ` · Date of birth ${player.match.dateOfBirth ? "✓" : "×"}`} {player.match.email !== null && ` · Email ${player.match.email ? "✓" : "×"}`}</p>
                  <p className="mt-2 text-sm text-muted">{member ? `Already a ${shortClubName(clubName)} member. There is nothing to add.` : clubs.length ? `Plays for ${clubs.join(", ")}. Adding them keeps the same Player ID and history.` : "No current club membership."}</p>
                  {member ? (
                    <Link to={`/club-admin/players/${player.id}`} className={`${secondary} mt-3 w-full md:w-auto`}>View player</Link>
                  ) : (
                    <button type="button" disabled={action.busy} onClick={() => void choose(player)} className={`${exact ? button : secondary} mt-3 w-full md:w-auto`}>Add to my club</button>
                  )}
                </article>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl border-2 border-dashed border-[#b7cce3] bg-[#f4f8fc] p-5 text-[#1a3049] md:p-6">
            <h3 className="font-bold">Not in the list?</h3>
            <p className="mt-2 text-sm text-muted">Only create a new player if none of the results above is this person.</p>
            <button type="button" className={`${secondary} mt-3 w-full md:w-auto`} onClick={() => setStage("create")}>Create new player</button>
          </div>
        </div>
      )}

      {stage === "create" && (
        <CreatePlayerForm
          initialFirstName={fullName.trim().split(/\s+/)[0] ?? ""}
          initialLastName={fullName.trim().split(/\s+/).slice(1).join(" ")}
          initialDateOfBirth={dateOfBirth}
          toISODate={toISODate}
          onCreate={createPlayer}
          busy={action.busy}
          error={action.error}
          onCancel={() => { action.clearError(); setStage("choose"); }}
        />
      )}

      {stage === "done" && selected && (
        <div className="mt-5">
          <div role="status" className="rounded-2xl bg-[#e3f5eb] p-6 text-[#175e48]">
            <p className="text-xs font-semibold">✓ {created ? "New player created" : "Added to your club"}</p>
            <h2 className="mt-3 text-xl font-bold">{selected.firstName} {selected.lastName} is now in {clubName}</h2>
            <p className="mt-2 text-sm">Player ID {selected.id}. {created ? "They are a member of your club from today." : "Their existing Player ID and history stay the same."}</p>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
            <h3 className="mb-4 text-lg font-bold">What next?</h3>
            <div className="flex flex-col gap-3 md:flex-row">
              <Link to="/club-admin/teams" className={button}>Add to a team</Link>
              <button type="button" onClick={reset} className={secondary}>Add another player</button>
              <Link to="/club-admin/players" className={secondary}>Back to players</Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
