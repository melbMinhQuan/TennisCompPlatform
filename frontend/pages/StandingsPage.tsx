import { useContext, useEffect, useState, type ReactNode } from "react";
import { getStandings, type StandingsData } from "../api/standings";
import { UTR_RESOURCES } from "../data/support-content";
import { PlayerSessionContext } from "../context/PlayerSession";

type View = "teams" | "players" | "rankings";
const card = "min-w-0 rounded-[32px] bg-white p-6 text-[#1a3049]";
const control = "mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-[#c6d3e3] bg-white px-3 text-sm text-[#1a3049] focus:outline-2 focus:outline-blue-700";
const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Melbourne" }) : "Not available";

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { id: string; name: string }[] }) {
  return <label className="min-w-0 text-xs font-semibold text-[#586f8e]">{label}<select className={control} value={value} onChange={e => onChange(e.target.value)} disabled={!options.length}>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
}
function unique<T extends { id: string }>(items: T[]) { return [...new Map(items.map(i => [i.id, i])).values()]; }

type Section = StandingsData["sections"][number];

function StandingsContent({ data }: { data: StandingsData }) {
  const hasMyTeam = (s: Section) => data.ladders.some(r => r.sectionId === s.id && data.myTeamIds.includes(r.teamId));
  // When a filter changes, open the current season (preferring the player's own section), else the latest one.
  const pickSection = (candidates: Section[]) =>
    candidates.find(s => s.seasonStatus === "ACTIVE" && hasMyTeam(s))
    ?? candidates.find(s => s.seasonStatus === "ACTIVE")
    ?? candidates.find(hasMyTeam)
    ?? candidates.at(-1);
  const choose = (candidates: Section[]) => { const next = pickSection(candidates); if (next) setSectionId(next.id); };
  const initial = pickSection(data.sections) ?? data.sections[0];
  const [view, setView] = useState<View>("teams");
  const [sectionId, setSectionId] = useState(initial?.id ?? "");
  const [cohortId, setCohortId] = useState(data.cohorts[0]?.id ?? "");
  const [snapshotDate, setSnapshotDate] = useState("");
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const section = data.sections.find(s => s.id === sectionId) ?? initial;
  const cohort = data.cohorts.find(c => c.id === cohortId) ?? data.cohorts[0];
  const dates = [...new Set(data.rankings.filter(r => r.cohortId === cohort?.id).map(r => r.asOf))].sort().reverse();
  const selectedDate = dates.includes(snapshotDate) ? snapshotDate : dates[0];
  const ladder = data.ladders.filter(r => r.sectionId === section?.id).sort((a,b) => a.position-b.position);
  const players = data.standings.filter(r => r.sectionId === section?.id).sort((a,b) => a.position-b.position);
  const rankings = data.rankings.filter(r => r.cohortId === cohort?.id && r.asOf === selectedDate).sort((a,b) => a.rank-b.rank);
  const match = (name: string, mine: boolean) => name.toLowerCase().includes(query.trim().toLowerCase()) && (!onlyMine || mine);
  const visibleTeams = ladder.filter(r => match(r.name, data.myTeamIds.includes(r.teamId)));
  const visiblePlayers = players.filter(r => match(r.name, r.playerId === data.playerId));
  const visibleRankings = rankings.filter(r => match(r.name, r.playerId === data.playerId));
  const myTeam = ladder.find(r => data.myTeamIds.includes(r.teamId));
  const myStanding = players.find(r => r.playerId === data.playerId);
  const myRanking = rankings.find(r => r.playerId === data.playerId);
  // The ladder covers home-and-away rounds only; the Grand Final decides the premiers.
  const finals = data.finals.find(f => f.sectionId === section?.id);
  const teamName = (id?: string) => ladder.find(r => r.teamId === id)?.name;
  const finalsTag = (teamId: string) => teamId === finals?.premiersTeamId ? "PREMIERS" : teamId === finals?.runnersUpTeamId ? "RUNNERS-UP" : null;
  const isFinalLadder = view !== "rankings" && section?.seasonStatus !== "ACTIVE";
  const asOf = view === "rankings" ? selectedDate : [...new Set((view === "teams" ? ladder : players).map(r => r.asOf))].sort().reverse()[0];
  const total = view === "teams" ? ladder.length : view === "players" ? players.length : rankings.length;
  const shown = view === "teams" ? visibleTeams.length : view === "players" ? visiblePlayers.length : visibleRankings.length;
  const headers = view === "teams" ? ["Pos", "Team", "Played", "Won", "Lost", "Drawn", "Rubbers F/A", "Sets F/A", "Games F/A", "Points"] : view === "players" ? ["Pos", "Player", "Rubbers played", "Won", "Lost", "Sets W/L", "Games W/L", "Win %"] : ["Rank", "Player", "UTR", "Compared with group"];
  const row = (id: string, mine: boolean, values: ReactNode[], tag: string | null = null) => <tr key={id} className={mine ? "bg-[#edf5ff]" : "even:bg-[#f8fafc]"}>{values.map((value,i) => i === 1 ? <th key={i} scope="row" className="min-w-48 px-4 py-4 text-left font-semibold">{value}{mine && <span className="ml-2 inline-block rounded bg-[#dbeafe] px-2 py-0.5 text-[10px] text-[#075bc5]">{view === "teams" ? "YOUR TEAM" : "YOU"}</span>}{tag && <span className="ml-2 inline-block rounded bg-[#e5f4ec] px-2 py-0.5 text-[10px] text-[#197354]">{tag}</span>}</th> : <td key={i} className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{value}</td>)}</tr>;
  return <>
    <section className="rounded-[32px] bg-[#1a3049] p-6 text-white">
      <p className="text-sm text-[#bacbdf]">{data.playerName}</p>
      <h2 className="mt-1 text-xl font-bold">Your competition overview</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3">{[
        ["Team position", myTeam ? "#" + myTeam.position + " · " + myTeam.name : "Not ranked in this section"],
        ["Player position", myStanding ? "#" + myStanding.position + " in this section" : "Not ranked in this section"],
        ["UTR rank", myRanking ? "#" + myRanking.rank + " · " + cohort?.name : "Not ranked in this group"],
      ].map(([label,value]) => <div key={label}><dt className="text-xs text-[#bacbdf]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl>
    </section>
    <div role="group" aria-label="Standings view" className="grid grid-cols-3 gap-1 rounded-xl bg-[#dfe7f1] p-1">{([["teams","Team standings"],["players","Player standings"],["rankings","UTR rankings"]] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => { setView(id); setQuery(""); setOnlyMine(false); }} className={"min-h-12 rounded-lg px-2 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-700 " + (view === id ? "bg-white text-[#075bc5] shadow-sm" : "text-[#425c7c] hover:bg-white/60")}>{label}</button>)}</div>
    <section className={card} aria-label="Filter standings">
      {view !== "rankings" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Select label="Association" value={section?.associationId ?? ""} options={unique(data.sections.map(s => ({id:s.associationId,name:s.associationName})))} onChange={id => choose(data.sections.filter(s => s.associationId === id))} />
        <Select label="Competition" value={section?.competitionId ?? ""} options={unique(data.sections.filter(s => s.associationId === section?.associationId).map(s => ({id:s.competitionId,name:s.competitionName})))} onChange={id => choose(data.sections.filter(s => s.competitionId === id))} />
        <Select label="Season" value={section?.seasonId ?? ""} options={unique(data.sections.filter(s => s.competitionId === section?.competitionId).map(s => ({id:s.seasonId,name:s.seasonLabel + (s.seasonStatus === "ACTIVE" ? " · Current" : " · Past")})))} onChange={id => choose(data.sections.filter(s => s.seasonId === id))} />
        <Select label="Section" value={section?.id ?? ""} options={data.sections.filter(s => s.seasonId === section?.seasonId)} onChange={setSectionId} />
      </div> : <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Ranking group / discipline" value={cohort?.id ?? ""} options={data.cohorts} onChange={id => { setCohortId(id); setSnapshotDate(""); }} />
        <Select label="Ranking date" value={selectedDate ?? ""} options={dates.map(d => ({id:d,name:dateLabel(d)}))} onChange={setSnapshotDate} />
        <p className="text-sm text-[#586f8e] sm:col-span-2">{cohort?.description} These rankings apply to this group and discipline, not a global ranking. UTR ratings are supplied by Universal Tennis; Waverley Tennis does not calculate UTR.</p>
      </div>}
    </section>
    <section className={card} aria-label="Results">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{view === "rankings" ? cohort?.name ?? "Rating rankings" : (section?.competitionName ?? "Standings") + " · " + (section?.name ?? "")}</h2><p className="mt-1 text-sm text-[#586f8e]">{view === "rankings" ? cohort?.discipline : (section?.seasonLabel ?? "") + (section?.seasonStatus === "ACTIVE" ? " · Current season" : " · Past season")} · {isFinalLadder ? "Final ladder" : "Updated " + dateLabel(asOf ?? "")}</p></div></div>
      {view === "teams" && finals && <p className="mt-3 rounded-lg bg-[#f0f5fc] p-3 text-sm">Premiers: <strong>{teamName(finals.premiersTeamId) ?? "Not recorded"}</strong> · Runners-up: <strong>{teamName(finals.runnersUpTeamId) ?? "Not recorded"}</strong>. The ladder shows the home-and-away rounds; the finals decided the premiers.</p>}
      <div className="my-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="text-xs font-semibold text-[#586f8e] sm:w-72">Search {view === "teams" ? "teams" : "players"}<input type="search" value={query} onChange={e => setQuery(e.target.value)} className={control} placeholder={view === "teams" ? "Team name" : "Player name"} /></label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} className="size-4 accent-blue-700" />{view === "teams" ? "My teams only" : "My position only"}</label></div>
      <p aria-live="polite" className="mb-3 text-xs text-[#586f8e]">Showing {shown} of {total} {view === "teams" ? "teams" : "players"}</p>
      {shown === 0 ? <p className="rounded-lg bg-[#f0f5fc] p-6 text-sm">{total === 0 ? "No standings recorded for this selection yet." : "No results match these filters."}</p> : <div className="overflow-x-auto rounded-lg border border-[#dce4ee]" role="region" aria-label="Standings table, scroll horizontally for all columns" tabIndex={0}><table className="w-full text-sm"><caption className="sr-only">{view === "teams" ? "Team standings" : view === "players" ? "Individual rubber standings" : "Rating rankings"} as of {dateLabel(asOf ?? "")}</caption><thead className="bg-[#f0f5fc] text-xs text-[#506784]"><tr>{headers.map((h,i) => <th key={h} scope="col" className={"whitespace-nowrap px-4 py-3 " + (i===1 ? "text-left" : "text-right")}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#e4eaf2]">
        {view === "teams" && visibleTeams.map(r => row(r.id,data.myTeamIds.includes(r.teamId),[r.position,r.name,r.played,r.won,r.lost,r.drawn,r.rubbersFor+"/"+r.rubbersAgainst,r.setsFor+"/"+r.setsAgainst,r.gamesFor+"/"+r.gamesAgainst,<strong>{r.points}</strong>],finalsTag(r.teamId)))}
        {view === "players" && visiblePlayers.map(r => row(r.id,r.playerId===data.playerId,[r.position,r.name,r.played,r.won,r.lost,r.setsWon+"/"+r.setsLost,r.gamesWon+"/"+r.gamesLost,r.winPercentage.toFixed(1)+"%"]))}
        {view === "rankings" && visibleRankings.map(r => row(r.id,r.playerId===data.playerId,[r.rank,r.name,r.rating.toFixed(2),"Better than " + Math.round(r.percentileRank) + "%"]))}
      </tbody></table></div>}
      <p className="mt-4 text-xs leading-5 text-[#586f8e]">{view === "teams" ? "F/A = for / against (won / lost). Teams are ranked by points." : view === "players" ? "Player standings count individual rubbers, not team fixtures. W/L = won / lost." : "“Better than 60%” = your UTR is higher than 60% of players in this group."}</p>
    </section>
    {view === "rankings" && <section className={card} aria-labelledby="utr-more-heading">
      <h2 id="utr-more-heading" className="text-xl font-bold">More information about your UTR</h2>
      <p className="mt-2 text-sm text-[#586f8e]">Your UTR is calculated by Universal Tennis, not Waverley Tennis. To see your latest rating, your rating history, or how your match results reach UTR, use these guides.</p>
      <ul className="mt-4 flex flex-col gap-3 sm:flex-row">{UTR_RESOURCES.map(link => <li key={link.url}>
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center rounded-full border border-[#c6d3e3] px-5 text-sm font-medium text-[#075bc5] hover:bg-[#f0f5fc] focus-visible:outline-2 focus-visible:outline-blue-700">
          {link.label}<span className="sr-only"> (opens in a new tab)</span><span aria-hidden="true" className="ml-1">↗</span>
        </a>
      </li>)}</ul>
    </section>}
  </>;
}

export default function StandingsPage() {
  const { email } = useContext(PlayerSessionContext);
  const [result,setResult] = useState<{identity:string;data?:StandingsData;error?:string}|null>(null);
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    getStandings(controller.signal).then(data => { if (!controller.signal.aborted) setResult({identity:email,data}); }).catch(() => { if (!controller.signal.aborted) setResult({identity:email,error:"We couldn’t load standings and rankings. Please try again."}); });
    return () => controller.abort();
  },[email,attempt]);
  const current = result?.identity === email ? result : null;
  return <div className="min-w-0 space-y-5 leading-[1.45]">
    <header><h1 className="text-[28px] font-semibold text-white md:text-[34px] md:text-[#1a3049]">Standings &amp; Rankings</h1><p className="mt-2 text-sm text-[#c4d3e5] md:text-[#586f8e]">Check your team's ladder position, player standings and your UTR ranking, this season and past ones.</p></header>
    {!current ? <p role="status" className={card}>Loading standings…</p> : current.error ? <section className={card}><p role="alert">{current.error}</p><button type="button" onClick={() => setAttempt(n=>n+1)} className="mt-4 min-h-11 rounded-lg bg-[#1a3049] px-4 text-white">Try again</button></section> : current.data && <StandingsContent key={email} data={current.data} />}
  </div>;
}
