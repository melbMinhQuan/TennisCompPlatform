import { useMemo, useState } from "react";
import { Link } from "react-router";
import { mockPlayers, mockClubs, mockClubMemberships } from "../data/mock-club-admin-players";
import type { ClubAdminPlayer } from "../types/clubAdminPlayer";
import {
  matchButtonClass,
  matchCardClass,
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";
import { clubAdminClubId } from "../data/club-admin-dashboard";

type Stage = "search" | "choose" | "done";
type Result = { player: ClubAdminPlayer; score: number };
// The signed-in administrator's club (sample until the login returns it).
const CLUB_ID = clubAdminClubId;
const clubName = mockClubs.find((club) => club.id === CLUB_ID)?.name ?? "Glen Waverley Tennis Club";
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
  const [selected, setSelected] = useState<ClubAdminPlayer | null>(null);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");

  const results = useMemo<Result[]>(() => {
    const name = normalize(fullName);
    const dob = toISODate(dateOfBirth);
    const mail = normalize(email);
    if (!name) return [];
    return mockPlayers.flatMap((player) => {
      const candidate = normalize(`${player.firstName} ${player.lastName}`);
      const exact = candidate === name;
      const similar = candidate.includes(name) || name.includes(candidate) ||
        candidate.split(" ").some((part) => part.length > 2 && name.split(" ").includes(part));
      if (!exact && !similar) return [];
      let score = exact ? 100 : 20;
      if (dob && player.dateOfBirth === dob) score += 30;
      if (mail && normalize(player.email ?? "") === mail) score += 30;
      return [{ player, score }];
    }).sort((a, b) => b.score - a.score).slice(0, 20);
  }, [fullName, dateOfBirth, email]);

  
  function search(event: React.FormEvent<HTMLFormElement>) {
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
    setStage("choose");
  }


  function choose(player: ClubAdminPlayer) {
    // Frontend-only prototype: no database mutation occurs here.
    setSelected(player);
    setCreated(false);
    setStage("done");
  }

  function createNew() {
    const parts = fullName.trim().split(/\s+/);
    const newPlayer: ClubAdminPlayer = {
      id: `DEMO-${Date.now()}`,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      dateOfBirth: toISODate(dateOfBirth),
      email: email || null,
      phone: null,
      status: "ACTIVE",
    };
    setSelected(newPlayer);
    setCreated(true);
    setStage("done");
  }

  const alreadyInClub = (playerId: string) => mockClubMemberships.some(
    (membership) => membership.playerId === playerId && membership.clubId === CLUB_ID && membership.status === "ACTIVE"
  );
  const otherClubs = (playerId: string) => mockClubMemberships
    .filter((membership) => membership.playerId === playerId && membership.clubId !== CLUB_ID && membership.status === "ACTIVE")
    .map((membership) => mockClubs.find((club) => club.id === membership.clubId)?.name)
    .filter((name): name is string => Boolean(name));

  function reset() {
    setStage("search"); setFullName(""); setDateOfBirth(""); setEmail("");
    setSelected(null); setCreated(false); setError("");
  }

  return (
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">Players / Add a player</p>
      {stage !== "done" && (
        <button type="button" onClick={() => stage === "choose" ? setStage("search") : window.history.back()}
          className={`${secondary} mt-5`}>
          ‹ {stage === "choose" ? "Change search" : "Players"}
        </button>
      )}
      <h1 className={`mt-5 ${pageTitleClass}`}>Add a player</h1>
      <p className="mt-4 text-sm text-[#d2dfed] md:text-muted">
        {stage === "search" ? "First we check if this person is already in the system, so nobody is entered twice."
          : stage === "choose" ? "Pick the person you mean. Each result tells you what will happen."
          : "All done. Here's what happened and what you can do next."}
      </p>
      <ol className="mt-5 flex flex-wrap items-center gap-2 text-sm" aria-label="Add player progress">
        {(["Search", "Choose", "Done"] as const).map((label, index) => {
          const current = ["search", "choose", "done"].indexOf(stage);
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
              <span className="mt-1 block text-xs font-normal text-muted">Optional</span>
            </label>
          </div>
          <p className="mt-4 text-sm text-muted">This demo searches a small sample from across Waverley Tennis. The live registry will search all clubs. Results never show date of birth or contact details.</p>
          {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          <button className={`${button} mt-4 w-full md:w-auto`} type="submit">Search</button>
        </form>
      )}

      {stage === "choose" && (
        <div className="mt-5">
          <h2 className="mb-4 text-lg font-bold">{results.length} results for “{fullName.trim()}”</h2>
          <div className="space-y-4">
            {results.map(({ player }) => {
              const member = alreadyInClub(player.id);
              const clubs = otherClubs(player.id);
              const exact = normalize(`${player.firstName} ${player.lastName}`) === normalize(fullName);
              return (
                <article key={player.id} className="rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
                  <div className="flex flex-col-reverse items-start justify-between gap-2 md:flex-row">
                    <h3 className="font-bold">{player.firstName} {player.lastName} · {player.id}</h3>
                    <span className={`rounded-md px-3 py-1 text-xs font-semibold ${member ? "bg-[#e4f5ec] text-[#187650]" : exact ? "bg-[#e7f0fa]" : "bg-[#fff1df] text-[#a45c14]"}`}>
                      {member ? "Already in your club" : exact ? "In another club / Not a member" : "Possible match"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">Name {exact ? "✓" : "similar"} {dateOfBirth && ` · Date of birth ${dateOfBirth === player.dateOfBirth ? "✓" : "×"}`} {email && ` · Email ${normalize(email) === normalize(player.email ?? "") ? "✓" : "×"}`}</p>
                  <p className="mt-2 text-sm text-muted">{member ? "Already a Glen Waverley member. There is nothing to add." : clubs.length ? `Plays for ${clubs.join(", ")}. Adding them keeps the same Player ID and history.` : "No active club membership found in the mock data."}</p>
                  {member ? (
                    <Link to={`/club-admin/players/${player.id}`} className={`${secondary} mt-3 w-full md:w-auto`}>View player</Link>
                  ) : (
                    <button type="button" onClick={() => choose(player)} className={`${exact ? button : secondary} mt-3 w-full md:w-auto`}>Add to my club</button>
                  )}
                </article>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl border-2 border-dashed border-[#b7cce3] bg-[#f4f8fc] p-5 text-[#1a3049] md:p-6">
            <h3 className="font-bold">Not in the list?</h3>
            <p className="mt-2 text-sm text-muted">Only create a new player if none of the results above is this person.</p>
            <button type="button" className={`${secondary} mt-3 w-full md:w-auto`} onClick={createNew}>Create new player</button>
          </div>
        </div>
      )}

      {stage === "done" && selected && (
        <div className="mt-5">
          <div role="status" className="rounded-2xl bg-[#e3f5eb] p-6 text-[#175e48]">
            <p className="text-xs font-semibold">✓ {created ? "New player created (demo)" : "Added to your club (demo)"}</p>
            <h2 className="mt-3 text-xl font-bold">{selected.firstName} {selected.lastName} is now in {clubName}</h2>
            <p className="mt-2 text-sm">Player ID {selected.id}. {created ? "This is a temporary demo record." : "Their existing Player ID and history stay the same."} No changes have been saved to the database.</p>
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
