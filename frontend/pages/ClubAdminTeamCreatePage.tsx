import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { createClubTeam, useClubTeams } from "../data/teamStore";

const CLUB_ID = "CLB01";
const primary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#4278b7] px-5 text-sm font-semibold text-white hover:bg-[#35699f]";
const secondary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#e5effa] px-5 text-sm font-semibold text-[#263d58] hover:bg-[#d8e6f5]";
const input = "mt-1 min-h-11 w-full rounded-lg border border-[#c6d6e8] bg-white px-4 text-sm text-[#263d58] outline-none focus:ring-2 focus:ring-[#4278b7]";

// Figma demo choices only: the provided team mock data has no competition/season records.
const COMPETITION = "Weekend Senior";
const SEASON = "Summer 2026/27";
const sections = [1, 2, 3, 4, 5, 6];

type CreatedTeam = { id: string; name: string; section: string; competition: string; season: string };

export default function ClubAdminTeamCreatePage() {
  const teams = useClubTeams();
  const [competition, setCompetition] = useState(COMPETITION);
  const [season, setSeason] = useState(SEASON);
  const [section, setSection] = useState("SEC02");
  const [name, setName] = useState("Glen Waverley C");
  const [created, setCreated] = useState<CreatedTeam | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const team = createClubTeam({ clubId: CLUB_ID, name, sectionId: section });
      setCreated({ id: team.id, name: team.name, section, competition, season });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create team.");
    }
  }

  const duplicate = teams.some(t => t.clubId === CLUB_ID && t.sectionId.toUpperCase() === section && t.name.trim().toLowerCase() === name.trim().toLowerCase());

  return (
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-[#60758d]">TEAMS&nbsp; / &nbsp;CREATE TEAM</p>
      {!created && <Link to="/club-admin/teams" className={`${secondary} mt-5`}>‹ Teams</Link>}
      <h1 className="mt-6 text-[30px] font-bold leading-tight md:text-[36px]">Create team</h1>
      <p className="mt-4 text-sm leading-6 text-[#d2dfed] md:text-base md:text-[#60758d]">
        {created ? "The team is registered. Next, add players and a team manager." : "Choose where the team will play, then give it a name."}
      </p>
      <div className="mt-4 flex items-center gap-3 text-sm font-semibold">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${created ? "bg-[#187650] text-white" : "bg-[#4278b7] text-white"}`}>{created ? "✓" : "1"}</span>
        <span className={created ? "text-[#8da1b5]" : "text-current"}>Details</span>
        <span className="h-px w-7 bg-[#c6d6e8]" />
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${created ? "bg-[#4278b7] text-white" : "border border-[#c6d6e8] bg-white text-[#60758d]"}`}>2</span>
        <span className={created ? "text-current" : "text-[#8da1b5]"}>Done</span>
      </div>

      {created ? (
        <>
          <div role="status" className="mt-5 rounded-2xl bg-[#e2f4eb] p-6 text-[#185c47]">
            <p className="text-xs font-semibold">Team registered</p>
            <h2 className="mt-3 text-xl font-bold">{created.name} is entered in {created.competition}</h2>
            <p className="mt-2 text-sm">{created.season} · Section {Number(created.section.replace("SEC", ""))}. It now appears in the section’s team list.</p>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-6 text-[#1a3049]">
            <h2 className="text-lg font-bold">What next?</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to={`/club-admin/teams/${created.id}/add-players`} className={primary}>+ Add players</Link>
              <Link to={`/club-admin/teams/${created.id}/manager`} className={secondary}>Assign team manager</Link>
              <Link to="/club-admin/teams" className={secondary}>Back to teams</Link>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="mt-5">
          <div className="rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
            <h2 className="text-lg font-bold">Where will this team play?</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-semibold">Competition *
                <select required className={input} value={competition} onChange={e => setCompetition(e.target.value)}><option value={COMPETITION}>{COMPETITION}</option></select>
                <span className="mt-2 block text-xs font-normal text-[#60758d]">Run by Waverley &amp; District TA</span>
              </label>
              <label className="text-sm font-semibold">Season *
                <select required className={input} value={season} onChange={e => setSeason(e.target.value)}><option value={SEASON}>{SEASON}</option></select>
                <span className="mt-2 block text-xs font-normal text-[#60758d]">Only seasons open for entries</span>
              </label>
              <label className="text-sm font-semibold">Section *
                <select required className={input} value={section} onChange={e => setSection(e.target.value)}>
                  {sections.map(n => <option key={n} value={`SEC${String(n).padStart(2, "0")}`}>Section {n}</option>)}
                </select>
                <span className="mt-2 block text-xs font-normal text-[#60758d]">Demo sections — availability not verified</span>
              </label>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
            <h2 className="text-lg font-bold">Team name</h2>
            <label className="mt-4 block text-sm font-semibold">Name *
              <input required maxLength={80} value={name} onChange={e => setName(e.target.value)} className={input} placeholder="Glen Waverley C" />
              <span className="mt-2 block text-xs font-normal text-[#60758d]">Suggested from your club name – must be unique in this section</span>
            </label>
          </div>
          {duplicate && <p className="mt-3 text-sm text-[#b53b3b]">A team with this name already exists in this section.</p>}
          {error && <p role="alert" className="mt-3 text-sm text-[#b53b3b]">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={!name.trim() || duplicate} className={`${primary} disabled:cursor-not-allowed disabled:opacity-50`}>Create team</button>
            <Link to="/club-admin/teams" className={secondary}>Cancel</Link>
          </div>
        </form>
      )}
    </section>
  );
}
