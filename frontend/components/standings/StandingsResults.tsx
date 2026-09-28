import StandingsTable from "./StandingsTable";
import { STANDINGS_CARD_CLASS, STANDINGS_CONTROL_CLASS, TABLE_NOTES, type TableRow, type View } from "./standings-helpers";

type StandingsResultsProps = {
  view: View;
  title: string;
  subtitle: string;
  /** Premiers and runners-up for a finished season; null while the season is running. */
  finals: { premiers: string; runnersUp: string } | null;
  query: string;
  onQueryChange: (query: string) => void;
  onlyMine: boolean;
  onOnlyMineChange: (onlyMine: boolean) => void;
  rows: TableRow[];
  total: number;
  asOf?: string;
};

/** Results card: heading, finals banner, search and "only me" filter, and the table. */
export default function StandingsResults(props: StandingsResultsProps) {
  const { view, rows, total } = props;
  const noun = view === "teams" ? "teams" : "players";
  return (
    <section className={STANDINGS_CARD_CLASS} aria-label="Results">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{props.title}</h2>
          <p className="mt-1 text-sm text-muted">{props.subtitle}</p>
        </div>
      </div>
      {view === "teams" && props.finals && (
        <p className="mt-3 rounded-lg bg-[#f0f5fc] p-3 text-sm">
          Premiers: <strong>{props.finals.premiers}</strong> · Runners-up: <strong>{props.finals.runnersUp}</strong>. The
          ladder shows the home-and-away rounds; the finals decided the premiers.
        </p>
      )}
      <div className="my-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="text-xs font-semibold text-muted sm:w-72">
          Search {noun}
          <input
            type="search"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            className={STANDINGS_CONTROL_CLASS}
            placeholder={view === "teams" ? "Team name" : "Player name"}
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={props.onlyMine}
            onChange={(event) => props.onOnlyMineChange(event.target.checked)}
            className="size-4 accent-blue-700"
          />
          {view === "teams" ? "My teams only" : "Show only me"}
        </label>
      </div>
      <p aria-live="polite" className="mb-3 text-xs text-muted">
        Showing {rows.length} of {total} {noun}
      </p>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-[#f0f5fc] p-6 text-sm">
          {total === 0 ? "No standings recorded for this selection yet." : "No results match these filters."}
        </p>
      ) : (
        <StandingsTable view={view} rows={rows} asOf={props.asOf} />
      )}
      <p className="mt-4 text-xs leading-5 text-muted">{TABLE_NOTES[view]}</p>
    </section>
  );
}
