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
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const section = data.sections.find((candidate) => candidate.id === sectionId) ?? initial;
  // The "Your UTR" summary uses the first ranking group's latest snapshot.
  const cohort = data.cohorts[0];
  const latestDate = [
    ...new Set(data.rankings.filter((ranking) => ranking.cohortId === cohort?.id).map((ranking) => ranking.asOf)),
  ]
    .sort()
    .reverse()[0];

  const ladder = data.ladders
    .filter((entry) => entry.sectionId === section?.id)
    .sort((left, right) => left.position - right.position);
  const players = data.standings
    .filter((standing) => standing.sectionId === section?.id)
    .sort((left, right) => left.position - right.position);

  const myTeam = ladder.find((entry) => data.myTeamIds.includes(entry.teamId));
  const myStanding = players.find((standing) => standing.playerId === data.playerId);
  const myRanking = data.rankings.find(
    (ranking) => ranking.cohortId === cohort?.id && ranking.asOf === latestDate && ranking.playerId === data.playerId,
  );

  // The ladder covers home-and-away rounds only; the Grand Final decides the premiers.
  const finals = data.finals.find((sectionFinals) => sectionFinals.sectionId === section?.id);
  const teamName = (id?: string) => ladder.find((entry) => entry.teamId === id)?.name ?? "Not recorded";
  const finalsTag = (teamId: string) =>
    teamId === finals?.premiersTeamId ? "PREMIERS" : teamId === finals?.runnersUpTeamId ? "RUNNERS-UP" : null;

  const matchesSearch = (name: string, mine: boolean) =>
    name.toLowerCase().includes(query.trim().toLowerCase()) && (!onlyMine || mine);
  const allRows: Record<View, TableRow[]> = {
    teams: ladder.map((entry) => ({
      id: entry.id,
      mine: data.myTeamIds.includes(entry.teamId),
      tag: finalsTag(entry.teamId),
      values: [
        entry.position,
        entry.name,
        entry.played,
        entry.won,
        entry.lost,
        entry.drawn,
        entry.rubbersFor + "/" + entry.rubbersAgainst,
        entry.setsFor + "/" + entry.setsAgainst,
        entry.gamesFor + "/" + entry.gamesAgainst,
        <strong>{entry.points}</strong>,
      ],
    })),
    players: players.map((standing) => ({
      id: standing.id,
      mine: standing.playerId === data.playerId,
      values: [
        standing.position,
        standing.name,
        standing.played,
        standing.won,
        standing.lost,
        standing.setsWon + "/" + standing.setsLost,
        standing.gamesWon + "/" + standing.gamesLost,
        standing.winPercentage.toFixed(1) + "%",
      ],
    })),
  };
  const rows = allRows[view].filter((row) => matchesSearch(String(row.values[1]), row.mine));

  const isFinalLadder = section?.seasonStatus !== "ACTIVE";
  const asOf = [...new Set((view === "teams" ? ladder : players).map((row) => row.asOf))].sort().reverse()[0];
  const title = (section?.competitionName ?? "Standings") + " · " + (section?.name ?? "");
  const scope =
    (section?.seasonLabel ?? "") + (section?.seasonStatus === "ACTIVE" ? " · Current season" : " · Past season");

  return (
    <>
      <StandingsOverview
        playerName={data.playerName}
        teamPosition={myTeam ? "#" + myTeam.position + " · " + myTeam.name : "Not ranked in this section"}
        playerPosition={myStanding ? "#" + myStanding.position + " in this section" : "Not ranked in this section"}
        utrRank={myRanking ? "#" + myRanking.rank + " · " + cohort?.name : "Not ranked in this group"}
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
        sections={data.sections}
        section={section}
        onChooseSection={(candidates) => {
          const next = pickSection(candidates, data);
          if (next) setSectionId(next.id);
        }}
        onSectionChange={setSectionId}
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
