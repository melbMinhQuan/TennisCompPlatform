import { useContext, useEffect, useState } from "react";
import { Link } from "react-router";
import { getPlayerMemberships, type Membership, type MembershipTeam, type PlayerMemberships } from "../api/memberships";
import { PlayerSessionContext } from "../context/PlayerSession";

const card = "min-w-0 rounded-[32px] bg-white p-6 text-[#1a3049]";
const primaryFirst = (a: Membership, b: Membership) => Number(b.isPrimary) - Number(a.isPrimary);

function Badge({ primary, kind }: { primary: boolean; kind: string }) {
  return <span className="inline-block shrink-0 rounded-md bg-[#e5f4ec] px-5 py-2.5 text-center text-xs font-semibold text-[#197354]">{primary ? "PRIMARY" : "ADDITIONAL"} {kind}</span>;
}

function monthYear(value: string | null) {
  const date = value ? new Date(value.slice(0, 10) + "T00:00:00Z") : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }) : null;
}

function membershipDetail(m: Membership) {
  const since = monthYear(m.startDate);
  const ended = monthYear(m.endDate);
  return (since ? "Member since " + since + " · " : "")
    + (ended ? "Ended " + ended : (m.status === "ACTIVE" ? "Active" : "Inactive") + " membership");
}

// Current-season teams first; past seasons stay listed but are labelled.
const currentFirst = (a: MembershipTeam, b: MembershipTeam) => Number(b.seasonStatus === "ACTIVE") - Number(a.seasonStatus === "ACTIVE");
const pastLabel = (team: MembershipTeam) => team.seasonStatus === "ACTIVE" ? "" : " · Past season";

function ClubCard({ club, teams }: { club: PlayerMemberships["clubs"][number]; teams: MembershipTeam[] }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = "teams-" + club.id;
  return <article className={card}>
    <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0"><h3 className="text-base font-bold [overflow-wrap:anywhere]">{club.name}</h3><p className="mt-1 text-[13px] text-[#586f8e]">{membershipDetail(club)}</p></div>
      <Badge primary={club.isPrimary} kind="CLUB" />
    </div>
    <p className="mb-1.5 mt-4 text-[10px] font-medium text-[#506784]">MY TEAMS</p>
    {teams.length ? <ul className="flex flex-wrap gap-2">{teams.slice(0, 2).map(team => <li key={team.id} className={`max-w-full rounded-2xl px-2.5 py-1 text-xs [overflow-wrap:anywhere] ${team.seasonStatus === "ACTIVE" ? "bg-[#eef1f5] text-[#2868ad]" : "bg-slate-100 text-slate-600"}`}>{team.name} · {team.competitionName} {team.seasonLabel}{pastLabel(team)}</li>)}{teams.length > 2 && <li className="px-2 py-1 text-xs text-[#586f8e]">+{teams.length - 2} more</li>}</ul> : <p className="text-sm text-[#586f8e]">No teams recorded for this club yet.</p>}
    {teams.length > 0 && <>
      <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)} className="mt-3 flex min-h-11 w-full items-center justify-end gap-1 bg-[#f0f5fc] px-5 text-sm font-medium text-[#075bc5] hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{expanded ? "Hide Teams" : "View Teams"} <span aria-hidden="true">{expanded ? "▴" : "▾"}</span><span className="sr-only"> for {club.name}</span></button>
      <div id={panelId} hidden={!expanded}><ul className="mt-3 divide-y divide-[#dce4ee]">{teams.map(team => <li key={team.id} className="text-sm [overflow-wrap:anywhere]"><Link to={`/dashboard/clubs/teams/${encodeURIComponent(team.id)}`} className="block rounded-lg px-2 py-4 hover:bg-[#f0f5fc] focus-visible:outline-2 focus-visible:outline-blue-700"><p className="font-semibold">{team.name}</p><p className="mt-1 text-[#586f8e]">{team.competitionName} · {team.seasonLabel} · {team.sectionName}{pastLabel(team)}</p><span className="mt-3 inline-block font-medium text-[#075bc5]">View team members <span aria-hidden="true">→</span></span></Link></li>)}</ul></div>
    </>}
  </article>;
}

export default function MyClubsPage() {
  const { email } = useContext(PlayerSessionContext);
  const [result, setResult] = useState<{ identity: string; data?: PlayerMemberships; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    getPlayerMemberships(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ identity: email, data });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ identity: email, error: "We couldn’t load your memberships. Please try again." });
    });
    return () => controller.abort();
  }, [email, attempt]);
  const current = result?.identity === email ? result : null;
  const data = current?.data;
  const associations = data ? [...data.associations].sort(primaryFirst) : [];
  const clubs = data ? [...data.clubs].sort(primaryFirst) : [];
  // Club ownership alone does not establish a player's association membership.
  const ungroupedClubs = clubs.filter(c => !associations.some(a => a.associationId === c.associationId));
  const primaryAssociation = associations.find(a => a.isPrimary);
  const clubCard = (club: PlayerMemberships["clubs"][number]) => <ClubCard key={data!.player.id + club.id} club={club} teams={data!.teams.filter(t => t.clubId === club.clubId).sort(currentFirst)} />;
  return <div className="min-w-0 space-y-5 leading-[1.45]">
    <h1 className="text-[28px] font-semibold text-white md:text-[34px] md:text-[#1a3049]">My Clubs &amp; Associations &amp; Teams</h1>
    {!current ? <p role="status" className={card}>Loading your memberships…</p> : current.error ? <div className={card}><p role="alert">{current.error}</p><button onClick={() => setAttempt(a => a + 1)} className="mt-3 min-h-11 rounded-lg bg-[#1a3049] px-4 text-white">Try again</button></div> : data && <>
      <section aria-label="Membership summary" className="flex flex-col gap-5 rounded-[32px] bg-[#1a3049] px-6 py-5 text-white xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 text-center xl:text-left"><h2 className="text-xl font-bold [overflow-wrap:anywhere]">{data.player.displayName}</h2><p className="mt-1 text-[13px] text-[#bacbdf]">Player{primaryAssociation ? " · primary association: " + primaryAssociation.name : ""}</p></div>
        <dl className="grid shrink-0 grid-cols-3 divide-x divide-[#3f72af] text-center">{[["Associations", new Set(associations.map(a => a.associationId)).size], ["Clubs", new Set(clubs.map(c => c.clubId)).size], ["Teams", new Set(data.teams.map(t => t.id)).size]].map(([label, count]) => <div key={label} className="px-2 sm:px-5"><dd className="text-3xl font-bold">{count}</dd><dt className="mt-0.5 text-[10px] font-medium uppercase text-[#bacbdf]">{label}</dt></div>)}</dl>
      </section>
      {associations.map(a => {
        const associatedClubs = clubs.filter(c => c.associationId === a.associationId);
        return <section key={a.id} className="space-y-3" aria-label={a.name}>
          <div className="flex flex-col items-start gap-3 px-1 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><h2 className="text-lg font-bold text-white [overflow-wrap:anywhere] md:text-[#1a3049]">{a.name}</h2><p className="text-[13px] text-[#c4d3e5] md:text-[#586f8e]">{membershipDetail(a)}</p></div><Badge primary={a.isPrimary} kind="ASSOCIATION" /></div>
          {associatedClubs.length ? associatedClubs.map(clubCard) : <p className={card + " text-center text-sm"}>No clubs recorded under this association yet.</p>}
        </section>;
      })}
      {ungroupedClubs.length > 0 && <section className="space-y-3"><h2 className="text-lg font-bold text-white md:text-[#1a3049]">Other club memberships</h2>{ungroupedClubs.map(c => <div key={c.id}><p className="mb-2 text-sm text-white md:text-[#586f8e]">{c.associationName}</p>{clubCard(c)}</div>)}</section>}
      {!associations.length && !clubs.length && <p className={card}>No association or club memberships recorded yet.</p>}
    </>}
  </div>;
}
