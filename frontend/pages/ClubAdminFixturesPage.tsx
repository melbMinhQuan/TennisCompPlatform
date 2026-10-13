import { useState } from "react";
import { useSearchParams } from "react-router";
import { filterClubFixtures, getClubAdminFixtures, type FixtureFilter } from "../api/club-admin-fixtures";
import { useApiData } from "../api/useApiData";
import FixtureFilters from "../components/club-admin/fixtures/FixtureFilters";
import FixtureListItem from "../components/club-admin/fixtures/FixtureListItem";
import MatchLoadState from "../components/MatchLoadState";
import { matchCardClass, matchLightButtonClass, pageClass, pageIntroClass, pageTitleClass, tabClass } from "../components/MatchesUI";

const PAGE_SIZE = 8;
const NO_FILTERS = { season: "all", team: "all", search: "" };

/**
 * Club administrator Fixtures & Results (view only). The tab is kept in the URL (?view=results)
 * so the detail page can link back to the right tab.
 */
export default function ClubAdminFixturesPage() {
  const { data, error, retry } = useApiData(getClubAdminFixtures);
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "results" ? "results" : "fixtures";
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);

  const filter: FixtureFilter = { view, ...filters };
  const fixtures = data ?? [];
  const shown = filterClubFixtures(fixtures, filter);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const isResults = view === "results";

  const changeFilters = (changes: Partial<FixtureFilter>) => {
    setFilters((previous) => ({ ...previous, ...changes }));
    setPage(1);
  };
  const changeView = (next: FixtureFilter["view"]) => {
    setParams({ view: next });
    setPage(1);
  };

  return (
    <div className={pageClass}>
      <header>
        <h1 className={pageTitleClass}>Fixtures &amp; Results</h1>
        <p className={pageIntroClass}>Glen Waverley Tennis Club’s team fixtures and recorded results.</p>
      </header>

      {!data ? (
        <MatchLoadState error={error} retry={retry} />
      ) : (
        <>
          <div role="group" aria-label="Choose fixtures or results" className="flex gap-3">
            <button type="button" className={tabClass(!isResults)} aria-pressed={!isResults} onClick={() => changeView("fixtures")}>
              Fixtures
            </button>
            <button type="button" className={tabClass(isResults)} aria-pressed={isResults} onClick={() => changeView("results")}>
              Results
            </button>
          </div>

          <FixtureFilters fixtures={fixtures} filter={filter} onChange={changeFilters} />

          <section className={matchCardClass} aria-labelledby="fixture-list-heading">
            <h2 id="fixture-list-heading" className="text-xl font-semibold">
              {isResults ? "Recorded results" : "Scheduled and postponed fixtures"}
            </h2>
            <p role="status" className="mt-2 text-sm text-muted">
              {shown.length} {isResults ? "results" : "fixtures"} found.
            </p>

            {shown.length === 0 ? (
              <div className="mt-4">
                <p className="text-sm text-muted">No matches for these filters.</p>
                <button type="button" className={`${matchLightButtonClass} mt-3`} onClick={() => changeFilters(NO_FILTERS)}>
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="mt-2">
                {shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((fixture) => (
                  <FixtureListItem key={fixture.id} fixture={fixture} showResult={isResults} />
                ))}
              </ul>
            )}

            {pageCount > 1 && (
              <nav aria-label="Fixture pages" className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" disabled={current === 1} className={`${matchLightButtonClass} disabled:opacity-40`} onClick={() => setPage(current - 1)}>
                  Previous
                </button>
                <span className="text-sm">
                  Page {current} of {pageCount}
                </span>
                <button type="button" disabled={current === pageCount} className={`${matchLightButtonClass} disabled:opacity-40`} onClick={() => setPage(current + 1)}>
                  Next
                </button>
              </nav>
            )}
          </section>
        </>
      )}
    </div>
  );
}
