import { useMemo, useState } from "react";
import { ageLimitLabel, getAssociationJuniors, type AssociationJunior, type AssociationJuniorTeam } from "../api/association-admin";
import { useAssociationAdminData } from "../api/useApiData";
import GuardianContact from "../components/junior/GuardianContact";
import JuniorNotice from "../components/junior/JuniorNotice";
import MatchLoadState from "../components/MatchLoadState";
import { matchCardClass, pageTitleClass } from "../components/MatchesUI";
import { dayMonthYear as longDate, displayId } from "../utils/formatters";

const sentence = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
const hasAgeProblem = (junior: AssociationJunior) => junior.teams.some((team) => team.eligible === false);

/** One team's age check: a tick, a cross, or why there is nothing to check. */
function AgeCheck({ team }: { team: AssociationJuniorTeam }) {
  const limit = ageLimitLabel(team);
  if (team.eligible === null) {
    return <span className="text-sm text-muted">{limit ? "Season start date not set, so age cannot be checked" : "No age limit"}</span>;
  }
  const on = `${team.ageOnSeasonStart} on ${longDate(team.seasonStart!)}`;
  if (team.eligible) return <span className="text-sm font-medium text-[#187650]">✓ Eligible: {on} ({limit})</span>;
  const tooOld = team.maxAge !== null && team.ageOnSeasonStart! > team.maxAge;
  return (
    <span className="text-sm font-semibold text-[#b42318]">
      ✗ Too {tooOld ? "old" : "young"} for {team.sectionName}: {on} ({limit})
    </span>
  );
}

export default function AssociationAdminJuniorsPage() {
  const { data, error, retry } = useAssociationAdminData(getAssociationJuniors);
  const [search, setSearch] = useState("");
  const [problemsOnly, setProblemsOnly] = useState(false);

  const juniors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.juniors ?? []).filter((junior) =>
      (!problemsOnly || hasAgeProblem(junior)) &&
      (!query || `${junior.firstName} ${junior.lastName}`.toLowerCase().includes(query) || displayId(junior).toLowerCase().includes(query)));
  }, [data, search, problemsOnly]);

  if (!data) return <MatchLoadState error={error} retry={retry} />;
  const problems = data.juniors.filter(hasAgeProblem).length;

  return (
    <section className="space-y-5 text-white md:text-[#1a3049]">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">{data.association.name}</p>
        <h1 className={`mt-2 ${pageTitleClass}`}>Juniors</h1>
        <p className="mt-2 text-sm text-[#d2dfed] md:text-muted">
          Every junior registered with the association or one of its clubs: {data.juniors.length} {data.juniors.length === 1 ? "junior" : "juniors"},{" "}
          {problems === 0 ? "none outside their section's age limit" : `${problems} outside a section's age limit`}. Ages are as of {longDate(data.asOf)}.
        </p>
      </header>

      <JuniorNotice audience="association" />

      <div className={`${matchCardClass} flex flex-col gap-3 text-[#1a3049] md:flex-row md:items-center`}>
        <label className="flex-1 text-sm font-medium">
          <span className="sr-only">Search juniors</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or Player ID"
            className="h-11 w-full rounded-lg border border-[#b7cce3] px-3"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={problemsOnly} onChange={(event) => setProblemsOnly(event.target.checked)} className="size-4" />
          Only age problems
        </label>
      </div>

      {juniors.length === 0 ? (
        <p className={`${matchCardClass} text-sm text-muted`}>
          {data.juniors.length === 0 ? "No juniors are registered with the association." : "No juniors match your search."}
        </p>
      ) : (
        <ul className="space-y-4" aria-label="Juniors">
          {juniors.map((junior) => (
            <li key={junior.id} className={`${matchCardClass} text-[#1a3049]`}>
              <article aria-labelledby={`junior-${junior.id}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`junior-${junior.id}`} className="text-lg font-bold">
                    {junior.firstName} {junior.lastName} <span className="text-sm font-normal text-muted">· {displayId(junior)}</span>
                  </h2>
                  {hasAgeProblem(junior) && (
                    <span className="rounded-md bg-[#fde8e7] px-3 py-1 text-xs font-semibold text-[#b42318]">Age problem</span>
                  )}
                </div>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                  {[
                    ["Date of birth", longDate(junior.dateOfBirth)],
                    ["Age", String(junior.age)],
                    ["Gender", sentence(junior.gender)],
                    ["Email", junior.email ?? "Not supplied"],
                    ["Phone", junior.phone ?? "Not supplied"],
                    ["Clubs", junior.clubs.map((club) => (club.isPrimary ? `${club.name} (primary)` : club.name)).join(", ") || "None"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="mt-1 font-semibold [overflow-wrap:anywhere]">{value}</dd>
                    </div>
                  ))}
                </dl>
                <GuardianContact guardian={junior.guardian} className="mt-4 border-t border-[#dbe4ef] pt-4" />
                <h3 className="mt-4 text-sm font-bold">Teams and eligibility</h3>
                {junior.teams.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">Not in a team in the association's competitions.</p>
                ) : (
                  <ul className="mt-1 divide-y divide-[#dbe4ef]">
                    {junior.teams.map((team) => (
                      <li key={team.teamId} className="py-2">
                        <p className="text-sm font-semibold">{team.teamName}</p>
                        <p className="text-sm text-muted">{team.competitionName} · {team.seasonLabel} · {team.sectionName}</p>
                        <AgeCheck team={team} />
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
