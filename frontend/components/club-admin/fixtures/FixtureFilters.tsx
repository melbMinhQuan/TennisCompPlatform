import type { ClubAdminFixture, FixtureFilter } from "../../../api/club-admin-fixtures";
import { clubTeamsOf } from "../../../api/club-admin-fixtures";
import { matchCardClass } from "../../MatchesUI";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink";

type Props = {
  fixtures: ClubAdminFixture[];
  filter: FixtureFilter;
  onChange: (changes: Partial<FixtureFilter>) => void;
};

/** Season, club team and search filters for the Fixtures & Results page. */
export default function FixtureFilters({ fixtures, filter, onChange }: Props) {
  const seasons = [
    ...new Map(fixtures.map((fixture) => [fixture.seasonId, `${fixture.competition} · ${fixture.seasonLabel}`])).entries(),
  ];
  const inSeason = fixtures.filter((fixture) => filter.season === "all" || fixture.seasonId === filter.season);
  const seasonOf = (teamId: string) =>
    fixtures.find((fixture) => fixture.homeTeam.id === teamId || fixture.awayTeam.id === teamId)?.seasonLabel;

  return (
    <section className={matchCardClass} aria-label="Filter fixtures and results">
      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Competition &amp; season
          <select className={inputClass} value={filter.season} onChange={(event) => onChange({ season: event.target.value, team: "all" })}>
            <option value="all">All seasons</option>
            {seasons.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Club team
          <select className={inputClass} value={filter.team} onChange={(event) => onChange({ team: event.target.value })}>
            <option value="all">All club teams</option>
            {clubTeamsOf(inSeason).map(([id, name]) => (
              <option key={id} value={id}>
                {name} · {seasonOf(id)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Search
          <input
            type="search"
            className={inputClass}
            value={filter.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Team, round or venue"
          />
        </label>
      </div>
    </section>
  );
}
