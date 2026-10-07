import { useState } from "react";
import type { StandingsData } from "../../api/standings";
import StandingsFilters from "./StandingsFilters";
import StandingsOverview from "./StandingsOverview";
import StandingsResults from "./StandingsResults";
import StandingsTabs from "./StandingsTabs";
import { dateLabel, pickSection, type TableRow, type View } from "./standings-helpers";

/** Holds the selected view, filters and search, and works out what each part of the page shows. */
export default function StandingsContent({ data }: { data: StandingsData }) {
  const initial = pickSection(data.sections, data) ?? data.sections[0];
  const [view, setView] = useState<View>("teams");
  const [sectionId, setSectionId] = useState(initial?.id ?? "");
  const [cohortId, setCohortId] = useState(data.cohorts[0]?.id ?? "");
  const [snapshotDate, setSnapshotDate] = useState("");
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const section = data.sections.find((s) => s.id === sectionId) ?? initial;
  const cohort = data.cohorts.find((c) => c.id === cohortId) ?? data.cohorts[0];
  const dates = [...new Set(data.rankings.filter((r) => r.cohortId === cohort?.id).map((r) => r.asOf))]
    .sort()
    .reverse();
  const selectedDate = dates.includes(snapshotDate) ? snapshotDate : dates[0];

  const ladder = data.ladders.filter((r) => r.sectionId === section?.id).sort((a, b) => a.position - b.position);
  const players = data.standings.filter((r) => r.sectionId === section?.id).sort((a, b) => a.position - b.position);
  const rankings = data.rankings
    .filter((r) => r.cohortId === cohort?.id && r.asOf === selectedDate)
    .sort((a, b) => a.rank - b.rank);

  const myTeam = ladder.find((r) => data.myTeamIds.includes(r.teamId));
  const myStanding = players.find((r) => r.playerId === data.playerId);
  // The ladder covers home-and-away rounds only; the Grand Final decides the premiers.
  const finals = data.finals.find((f) => f.sectionId === section?.id);
  const teamName = (id?: string) => ladder.find((r) => r.teamId === id)?.name ?? "Not recorded";
  const finalsTag = (teamId: string) =>
    teamId === finals?.premiersTeamId ? "PREMIERS" : teamId === finals?.runnersUpTeamId ? "RUNNERS-UP" : null;

  const matchesSearch = (name: string, mine: boolean) =>
    name.toLowerCase().includes(query.trim().toLowerCase()) && (!onlyMine || mine);
  const allRows: Record<View, TableRow[]> = {
    teams: ladder.map((r) => ({
      id: r.id,
      mine: data.myTeamIds.includes(r.teamId),
      tag: finalsTag(r.teamId),
      values: [
        r.position,
        r.name,
        r.played,
        r.won,
        r.lost,
        r.drawn,
        r.rubbersFor + "/" + r.rubbersAgainst,
        r.setsFor + "/" + r.setsAgainst,
        r.gamesFor + "/" + r.gamesAgainst,
        <strong>{r.points}</strong>,
      ],
    })),
    players: players.map((r) => ({
      id: r.id,
      mine: r.playerId === data.playerId,
      values: [
        r.position,
        r.name,
        r.played,
        r.won,
        r.lost,
        r.setsWon + "/" + r.setsLost,
        r.gamesWon + "/" + r.gamesLost,
        r.winPercentage.toFixed(1) + "%",
      ],
    })),
    rankings: rankings.map((r) => ({
      id: r.id,
      mine: r.playerId === data.playerId,
      values: [r.rank, r.name, r.rating.toFixed(2), "Better than " + Math.round(r.percentileRank) + "%"],
    })),
  };
  const rows = allRows[view].filter((row) => matchesSearch(String(row.values[1]), row.mine));

  const isFinalLadder = view !== "rankings" && section?.seasonStatus !== "ACTIVE";
  const asOf =
    view === "rankings"
      ? selectedDate
      : [...new Set((view === "teams" ? ladder : players).map((r) => r.asOf))].sort().reverse()[0];
  const title =
    view === "rankings"
      ? (cohort?.name ?? "Rating rankings")
      : (section?.competitionName ?? "Standings") + " · " + (section?.name ?? "");
  const scope =
    view === "rankings"
      ? cohort?.discipline
      : (section?.seasonLabel ?? "") + (section?.seasonStatus === "ACTIVE" ? " · Current season" : " · Past season");

  return (
    <>
      <StandingsOverview
        playerName={data.playerName}
        teamPosition={myTeam ? "#" + myTeam.position + " · " + myTeam.name : "Not ranked in this section"}
        playerPosition={myStanding ? "#" + myStanding.position + " in this section" : "Not ranked in this section"}
      />
      <StandingsTabs
        view={view}
        onChange={(next) => {
          setView(next);
          setQuery("");
          setOnlyMine(false);
        }}
      />
      <StandingsFilters
        view={view}
        sections={data.sections}
        section={section}
        cohorts={data.cohorts}
        cohort={cohort}
        dates={dates}
        selectedDate={selectedDate}
        onChooseSection={(candidates) => {
          const next = pickSection(candidates, data);
          if (next) setSectionId(next.id);
        }}
        onSectionChange={setSectionId}
        onCohortChange={(id) => {
          setCohortId(id);
          setSnapshotDate("");
        }}
        onDateChange={setSnapshotDate}
      />
      <StandingsResults
        view={view}
        title={title}
        subtitle={`${scope} · ${isFinalLadder ? "Final ladder" : "Updated " + dateLabel(asOf ?? "")}`}
        finals={finals ? { premiers: teamName(finals.premiersTeamId), runnersUp: teamName(finals.runnersUpTeamId) } : null}
        query={query}
        onQueryChange={setQuery}
        onlyMine={onlyMine}
        onOnlyMineChange={setOnlyMine}
        rows={rows}
        total={allRows[view].length}
        asOf={asOf}
      />
    </>
  );
}
