import StandingsSelect from "./StandingsSelect";
import { STANDINGS_CARD_CLASS, unique, type Section } from "./standings-helpers";

type StandingsFiltersProps = {
  sections: Section[];
  section?: Section;
  /** Picks the best section out of the matching candidates. */
  onChooseSection: (candidates: Section[]) => void;
  onSectionChange: (sectionId: string) => void;
};

/** Association → competition → season → section filters. */
export default function StandingsFilters(props: StandingsFiltersProps) {
  const { sections, section } = props;
  return (
    <section className={STANDINGS_CARD_CLASS} aria-label="Filter standings">
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
    </section>
  );
}
