import StandingsSelect from "./StandingsSelect";
import { STANDINGS_CARD_CLASS, dateLabel, unique, type Cohort, type Section, type View } from "./standings-helpers";

type StandingsFiltersProps = {
  view: View;
  sections: Section[];
  section?: Section;
  cohorts: Cohort[];
  cohort?: Cohort;
  dates: string[];
  selectedDate?: string;
  /** Picks the best section out of the matching candidates. */
  onChooseSection: (candidates: Section[]) => void;
  onSectionChange: (sectionId: string) => void;
  onCohortChange: (cohortId: string) => void;
  onDateChange: (date: string) => void;
};

/** Association → competition → season → section filters, or ranking group and date for UTR rankings. */
export default function StandingsFilters(props: StandingsFiltersProps) {
  const { view, sections, section, cohorts, cohort, dates, selectedDate } = props;
  return (
    <section className={STANDINGS_CARD_CLASS} aria-label="Filter standings">
      {view !== "rankings" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StandingsSelect
            label="Association"
            value={section?.associationId ?? ""}
            options={unique(sections.map((s) => ({ id: s.associationId, name: s.associationName })))}
            onChange={(id) => props.onChooseSection(sections.filter((s) => s.associationId === id))}
          />
          <StandingsSelect
            label="Competition"
            value={section?.competitionId ?? ""}
            options={unique(
              sections
                .filter((s) => s.associationId === section?.associationId)
                .map((s) => ({ id: s.competitionId, name: s.competitionName })),
            )}
            onChange={(id) => props.onChooseSection(sections.filter((s) => s.competitionId === id))}
          />
          <StandingsSelect
            label="Season"
            value={section?.seasonId ?? ""}
            options={unique(
              sections
                .filter((s) => s.competitionId === section?.competitionId)
                .map((s) => ({
                  id: s.seasonId,
                  name: s.seasonLabel + (s.seasonStatus === "ACTIVE" ? " · Current" : " · Past"),
                })),
            )}
            onChange={(id) => props.onChooseSection(sections.filter((s) => s.seasonId === id))}
          />
          <StandingsSelect
            label="Section"
            value={section?.id ?? ""}
            options={sections.filter((s) => s.seasonId === section?.seasonId)}
            onChange={props.onSectionChange}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StandingsSelect
            label="Ranking group / discipline"
            value={cohort?.id ?? ""}
            options={cohorts}
            onChange={props.onCohortChange}
          />
          <StandingsSelect
            label="Ranking date"
            value={selectedDate ?? ""}
            options={dates.map((date) => ({ id: date, name: dateLabel(date) }))}
            onChange={props.onDateChange}
          />
          <p className="text-sm text-muted sm:col-span-2">
            {cohort?.description} These rankings apply to this group and discipline, not a global ranking. UTR ratings
            are supplied by Universal Tennis; Waverley Tennis does not calculate UTR.
          </p>
        </div>
      )}
    </section>
  );
}
