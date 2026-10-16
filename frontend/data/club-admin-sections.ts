import { mockClubAdminDashboard } from "./club-admin-dashboard";

/** A section (SectionGrade) in one season; teams are entered into a section. */
export type ClubAdminSection = { id: string; seasonId: string; name: string };

// SectionGrade sheet of backend/prisma/competition_data.xlsx. Section IDs are unique across seasons
// (SEC03 is Winter 2026 Section 1), so the name must be looked up, never read from the ID.
export const mockSections: ClubAdminSection[] = [
  { id: "SEC01", seasonId: "SEA01", name: "Section 1" },
  { id: "SEC02", seasonId: "SEA02", name: "Section 1" },
  { id: "SEC03", seasonId: "SEA03", name: "Section 1" },
  { id: "SEC04", seasonId: "SEA03", name: "Section 2" },
  { id: "SEC05", seasonId: "SEA04", name: "Section 1" },
  { id: "SEC06", seasonId: "SEA05", name: "Section 1" },
  { id: "SEC07", seasonId: "SEA05", name: "Section 2" },
];

const seasons = mockClubAdminDashboard.seasons;

/** "Section 1", from the section's ID. */
export function sectionName(sectionId: string) {
  return mockSections.find((section) => section.id === sectionId)?.name ?? "Section to be confirmed";
}

/** The season record for a season ID (label, competition and status). */
export function seasonOf(seasonId: string) {
  return seasons.find((season) => season.id === seasonId);
}

/** "Weekend Senior · Winter 2026 · Section 1" for a team. */
export function teamPlacement(team: { seasonId: string; sectionId: string }) {
  const season = seasonOf(team.seasonId);
  return [season?.competition, season?.label, sectionName(team.sectionId)].filter(Boolean).join(" · ");
}

/** The season being played now (ACTIVE), and the next one open for entries (UPCOMING). */
export const activeSeason = seasons.find((season) => season.status === "ACTIVE");
export const upcomingSeason = seasons.find((season) => season.status === "UPCOMING");
