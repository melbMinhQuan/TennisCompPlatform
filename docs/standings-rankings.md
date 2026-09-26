# Standings and rankings

Route: /dashboard/rankings. Frontend-only implementation based on the functional
requirements: separate competition/season/section ladders, retained past seasons,
and individual statistics. docs/dashboardapi.md defines cohort-scoped ranking views.

## Data
frontend/data/competition-standings.json is a read-only display snapshot extracted
from Project detail/competition_data.xlsx. It includes five sections, 40 ladder
entries, 245 player standings, two ranking cohorts and 200 ranking entries.
Sources: Association, Competition, Season, SectionGrade, Team, Player,
TeamPlayer, LadderEntry, PlayerStanding, RankingCohort, RankingEntry.
Player names are joined by player ID; no emails, passwords, dates of birth,
phone numbers or other contact information are included.

The current mock identity is Chloe Cooper (PLR005), consistent with My Clubs.
Team highlights use TeamPlayer assignments. No visible sample-data footer.
Dates use Melbourne time. Past-season labels use Season.status, not today's date.

## Behaviour
- Team standings and player standings: dependent association, competition,
  season and section selectors. Default: a current section containing Chloe's team.
- Rating rankings: cohort/discipline selector and ranking snapshot date.
- Search and personal-only filters retain the source positions.
- Horizontal table scrolling on narrow screens; highlighted personal rows.
- Empty, loading and retry states.
- Team standings show supplied points, wins/losses/draws, rubbers, sets and games.
- Player standings use individual rubbers, not team fixtures.
- Rating ranks/percentiles are scoped to the chosen cohort and date; never
  represented as global or independently verified official rankings. The tab is
  labelled "UTR rankings" and states that UTR is supplied by Universal Tennis and
  not calculated by Waverley Tennis. Percentiles are shown as "Better than N%".
- Completed seasons show "Final ladder" and, when finals results exist, the
  premiers and runners-up (tagged in the table), because the ladder covers only
  the home-and-away rounds and the Grand Final decides the premiers.
- Changing association, competition or season opens the current season first
  (preferring the player's own section), otherwise the latest season.

Positions, points, percentages, ratings and percentile values are taken from
the workbook. The frontend does not infer tie-break rules or recalculate
competition ladders. Automatic recalculation after result entry belongs to
the future backend. The current page is a dated snapshot, not a live feed.

## API handoff
frontend/api/standings.ts exports StandingsData and getStandings(signal).
Set VITE_STANDINGS_API_URL to the agreed endpoint and restart/rebuild Vite.
Expected response: { data: StandingsData }. Map other backend response shapes in
this adapter. The contract currently contains playerId, playerName, myTeamIds,
sections, ladders, standings, cohorts, rankings and finals. finals[] is
{ sectionId, premiersTeamId, runnersUpTeamId } per completed section, taken
from the Grand Final result (PlayerAward SECTION_WINNER / RUNNER_UP in the workbook). See the type/snapshot for
field names. Return complete arrays for the offered scopes; if the backend uses
pagination or separate endpoints, update the adapter and loading flow accordingly.

The server must authenticate the viewer and supply their player identity and
permitted data. Fetch includes credentials and supports cancellation on identity
changes/unmount. API errors never fall back to Excel data. Authentication headers
may be adapted here when the backend team finalizes session handling.
