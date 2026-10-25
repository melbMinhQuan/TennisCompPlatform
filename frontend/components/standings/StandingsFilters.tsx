import StandingsSelect from "./StandingsSelect";
import { STANDINGS_CARD_CLASS, unique, type Section } from "./standings-helpers";

interface StandingsFiltersProps {
  sections: Section[];
  section?: Section;
  /** Picks the best section out of the matching candidates. */
  onChooseSection: (candidates: Section[]) => void;
  onSectionChange: (sectionId: string) => void;
}

/** Association → competition → season → section filters. */
export default function StandingsFilters(props: StandingsFiltersProps) {
  const { sections, section } = props;
  return (
    <section className={STANDINGS_CARD_CLASS} aria-label="Filter standings">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StandingsSelect
          label="Association"
          value={section?.associationId ?? ""}
          options={unique(sections.map((candidateSection) => ({ id: candidateSection.associationId, name: candidateSection.associationName })))}
          onChange={(id) => props.onChooseSection(sections.filter((candidateSection) => candidateSection.associationId === id))}
        />
        <StandingsSelect
          label="Competition"
          value={section?.competitionId ?? ""}
          options={unique(
            sections
              .filter((candidateSection) => candidateSection.associationId === section?.associationId)
              .map((candidateSection) => ({ id: candidateSection.competitionId, name: candidateSection.competitionName })),
          )}
          onChange={(id) => props.onChooseSection(sections.filter((candidateSection) => candidateSection.competitionId === id))}
        />
        <StandingsSelect
          label="Season"
          value={section?.seasonId ?? ""}
          options={unique(
            sections
              .filter((candidateSection) => candidateSection.competitionId === section?.competitionId)
              .map((candidateSection) => ({
                id: candidateSection.seasonId,
                name: candidateSection.seasonLabel + (candidateSection.seasonStatus === "ACTIVE" ? " · Current" : " · Past"),
              })),
          )}
          onChange={(id) => props.onChooseSection(sections.filter((candidateSection) => candidateSection.seasonId === id))}
        />
        <StandingsSelect
          label="Section"
          value={section?.id ?? ""}
          options={sections.filter((candidateSection) => candidateSection.seasonId === section?.seasonId)}
          onChange={props.onSectionChange}
        />
      </div>
    </section>
  );
}
