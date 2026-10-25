import { useContext, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { createClubTeam, getClubTeams, getOpenSections } from "../api/club-admin-teams";
import { useClubAdminData } from "../api/useApiData";
import { useClubAdminAction } from "../api/useClubAdminAction";
import { RoleSessionContext } from "../context/RoleSession";
import MatchLoadState from "../components/MatchLoadState";
import { shortClubName } from "../utils/formatters";

const primary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#4278b7] px-5 text-sm font-semibold text-white hover:bg-[#35699f]";
const secondary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#e5effa] px-5 text-sm font-semibold text-[#263d58] hover:bg-[#d8e6f5]";
const input = "mt-1 min-h-11 w-full rounded-lg border border-[#c6d6e8] bg-white px-4 text-sm text-[#263d58] outline-none focus:ring-2 focus:ring-[#4278b7]";

type CreatedTeam = { id: string; name: string; section: string; competition: string; season: string };

/** The club's short name and the first letter its teams have not used this season: "Glen Waverley C". */
function suggestedName(clubName: string, taken: string[]) {
  const base = shortClubName(clubName);
  const letter = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].find((next) => !taken.includes(`${base} ${next}`.toLowerCase()));
  return letter ? `${base} ${letter}` : base;
}

/** Each distinct value once, in order of first appearance. */
const distinct = <T,>(items: T[], key: (item: T) => string) => [...new Map(items.map((item) => [key(item), item])).values()];

/** The administrator's choice while it is still one of the options, otherwise the first option. */
const pick = (chosen: string | null, options: string[]) => (chosen !== null && options.includes(chosen) ? chosen : options[0] ?? "");

/**
 * Enters a new team in a section of a season open for entries (UPCOMING, run by the club's
 * association), as GET open-sections lists them. The backend refuses a name already used in the season.
 */
export default function ClubAdminTeamCreatePage() {
  const clubName = useContext(RoleSessionContext).signedIn?.clubName ?? "";
  const openSections = useClubAdminData(getOpenSections);
  // The club's own teams, to suggest a free name and warn about one already used this season.
  const clubTeams = useClubAdminData(getClubTeams);
  const action = useClubAdminAction();
  // Null means the first choice, or the suggested name, until the administrator picks another.
  const [competition, setCompetition] = useState<string | null>(null);
  const [season, setSeason] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedTeam | null>(null);

  const sections = openSections.data ?? [];
  const competitions = distinct(sections, (item) => item.competitionId);
  const competitionId = pick(competition, competitions.map((item) => item.competitionId));
  const seasons = distinct(sections.filter((item) => item.competitionId === competitionId), (item) => item.seasonId);
  const seasonId = pick(season, seasons.map((item) => item.seasonId));
  const seasonSections = sections.filter((item) => item.seasonId === seasonId);
  const sectionId = pick(section, seasonSections.map((item) => item.id));
  const taken = (clubTeams.data ?? []).filter((team) => team.seasonId === seasonId).map((team) => team.name.trim().toLowerCase());
  const teamName = name ?? suggestedName(clubName, taken);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const team = await action.run((email, signal) => createClubTeam({ sectionId, name: teamName.trim() }, email, signal));
    if (!team) return;
    setCreated({ id: team.id, name: team.name, section: team.sectionName, competition: team.competitionName, season: team.seasonLabel });
  }

  const duplicate = taken.includes(teamName.trim().toLowerCase());
  const loaded = openSections.data && clubTeams.data;

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
            <p className="mt-2 text-sm">{created.season} · {created.section}. It now appears in the section’s team list.</p>
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
      ) : !loaded ? (
        <div className="mt-5">
          <MatchLoadState error={openSections.error ?? clubTeams.error} retry={() => { openSections.retry(); clubTeams.retry(); }} />
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5">
          <div className="rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
            <h2 className="text-lg font-bold">Where will this team play?</h2>
            {sections.length === 0 && (
              <p className="mt-2 text-sm text-[#60758d]">No seasons are open for new teams right now. Check again when your association opens entries.</p>
            )}
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-semibold">Competition *
                <select required className={input} value={competitionId} onChange={event => setCompetition(event.target.value)}>
                  {competitions.map(item => <option key={item.competitionId} value={item.competitionId}>{item.competitionName}</option>)}
                </select>
                <span className="mt-2 block text-xs font-normal text-[#60758d]">Run by your association</span>
              </label>
              <label className="text-sm font-semibold">Season *
                <select required className={input} value={seasonId} onChange={event => setSeason(event.target.value)}>
                  {seasons.map(item => <option key={item.seasonId} value={item.seasonId}>{item.seasonLabel}</option>)}
                </select>
                <span className="mt-2 block text-xs font-normal text-[#60758d]">Only seasons open for entries</span>
              </label>
              <label className="text-sm font-semibold">Section *
                <select required className={input} value={sectionId} onChange={event => setSection(event.target.value)}>
                  {seasonSections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <span className="mt-2 block text-xs font-normal text-[#60758d]">Sections for this season</span>
              </label>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
            <h2 className="text-lg font-bold">Team name</h2>
            <label className="mt-4 block text-sm font-semibold">Name *
              <input required maxLength={80} value={teamName} onChange={event => setName(event.target.value)} className={input} placeholder={suggestedName(clubName, [])} />
              <span className="mt-2 block text-xs font-normal text-[#60758d]">Suggested from your club name. It must be unique in this season.</span>
            </label>
          </div>
          {duplicate && <p className="mt-3 text-sm text-[#b53b3b]">A team with this name already exists in this season.</p>}
          {action.error && <p role="alert" className="mt-3 text-sm text-[#b53b3b]">{action.error}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={!teamName.trim() || duplicate || !sectionId || action.busy} className={`${primary} disabled:cursor-not-allowed disabled:opacity-50`}>Create team</button>
            <Link to="/club-admin/teams" className={secondary}>Cancel</Link>
          </div>
        </form>
      )}
    </section>
  );
}
