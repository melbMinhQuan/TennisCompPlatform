import { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { getTeamDetails, type TeamDetails } from "../api/teams";
import { PlayerSessionContext } from "../context/PlayerSession";

const card = "rounded-[32px] bg-white p-6 text-[#1a3049]";
// Most members are ACTIVE, so only the unusual statuses get a badge.
const statusBadges = { ACTIVE: null, EMERGENCY: "Emergency", INACTIVE: "Inactive" };

export default function TeamDetailsPage() {
  const { teamId = "" } = useParams();
  const { email } = useContext(PlayerSessionContext);
  const [result, setResult] = useState<{ key: string; team?: TeamDetails | null; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const key = JSON.stringify([teamId, email]);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus();
  }, [teamId]);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    getTeamDetails(teamId, controller.signal).then(team => {
      if (!controller.signal.aborted) setResult({ key, team });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: error instanceof Error ? error.message : "Could not load this team." });
    });
    return () => controller.abort();
  }, [teamId, key, attempt]);
  const current = result?.key === key ? result : null;
  const team = current?.team;
  const members = team ? [...team.members].sort((a, b) => a.name.localeCompare(b.name)) : [];
  return <div className="min-w-0 space-y-5 leading-[1.45]">
    <Link to="/dashboard/clubs" className="inline-flex min-h-11 items-center text-sm font-medium text-white underline underline-offset-4 md:text-[#075bc5]">← Back to my clubs &amp; associations</Link>
    <h1 ref={heading} tabIndex={-1} className="text-[28px] font-semibold text-white outline-none md:text-[34px] md:text-[#1a3049]">Team Details</h1>
    {!current ? <p role="status" className={card}>Loading team details…</p> : current.error ? <section className={card}><p role="alert">{current.error}</p><button type="button" onClick={() => setAttempt(n => n + 1)} className="mt-4 min-h-11 rounded-lg bg-[#1a3049] px-4 text-white">Try again</button></section> : !team ? <p className={card}>This team could not be found.</p> : <>
      <section className="rounded-[32px] bg-[#1a3049] p-6 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-[#bacbdf]">{team.seasonStatus === "ACTIVE" ? "Current season" : "Past season"}</p>
        <h2 className="mt-2 text-2xl font-bold [overflow-wrap:anywhere]">{team.name}</h2>
        <p className="mt-2 text-sm text-[#bacbdf]">{team.clubName} · {team.associationName}</p>
        <dl className="mt-6 grid gap-4 border-t border-[#3f72af] pt-5 sm:grid-cols-3">{[["Competition", team.competitionName], ["Season", team.seasonLabel], ["Section", team.sectionName]].map(([label, value]) => <div key={label}><dt className="text-xs text-[#bacbdf]">{label}</dt><dd className="mt-1 font-semibold [overflow-wrap:anywhere]">{value}</dd></div>)}</dl>
      </section>
      <section className={card} aria-labelledby="team-members-heading">
        <div className="flex items-center justify-between gap-3"><h2 id="team-members-heading" className="text-xl font-bold">Team members</h2><span className="rounded-full bg-[#eef1f5] px-3 py-1 text-sm">{members.length} {members.length === 1 ? "member" : "members"}</span></div>
        {team.seasonStatus !== "ACTIVE" && <p className="mt-2 text-sm text-[#586f8e]">Members registered for this past season.</p>}
        {members.length === 0 ? <p className="mt-5 text-sm text-[#586f8e]">No team members recorded yet.</p> : <ul className="mt-4 divide-y divide-[#dce4ee]">{members.map(member => {
          const badge = statusBadges[member.status];
          return <li key={member.id} className={`flex flex-wrap items-center justify-between gap-3 px-2 py-4 ${member.isCurrentPlayer ? "rounded-lg bg-[#f0f5fc]" : ""}`}>
            <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef1f5] text-sm font-semibold text-[#315f96]">{member.name.split(/\s+/).slice(0, 2).map(n => n[0]).join("")}</span><h3 className="min-w-0 font-semibold [overflow-wrap:anywhere]">{member.name}{member.isCurrentPlayer && <span className="ml-2 rounded-full bg-[#1a3049] px-2 py-0.5 text-xs font-medium text-white">You</span>}</h3></div>
            {badge && <span className="rounded-md bg-[#eef1f5] px-3 py-1.5 text-xs font-medium text-[#506784]">{badge}</span>}
          </li>;
        })}</ul>}
      </section>
    </>}
  </div>;
}
