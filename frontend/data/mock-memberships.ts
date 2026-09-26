import type { PlayerMemberships } from "../api/memberships";

// Hardcoded until the backend endpoint exists. These are Chloe Cooper's (PLR005) rows copied
// from Project detail/competition_data.xlsx, keeping the workbook IDs, so after the API is
// connected, logging in as chloe.cooper005@players.example should show the same page.
const player = { id: "PLR005", firstName: "Chloe", lastName: "Cooper" };
const associations = [
  { id: "ASSOC01", name: "Waverley Tennis" },
  { id: "ASSOC02", name: "Eastern Districts Tennis" },
];
const clubs = [
  { id: "CLB01", associationId: "ASSOC01", name: "Glen Waverley Tennis Club" },
  { id: "CLB02", associationId: "ASSOC01", name: "Mount Waverley Tennis Club" },
  { id: "CLB03", associationId: "ASSOC01", name: "Syndal Tennis Club" },
  { id: "CLB11", associationId: "ASSOC02", name: "Forest Hill Tennis Club" },
];
const associationMemberships = [
  { id: "AM006", playerId: "PLR005", associationId: "ASSOC01", isPrimary: true, status: "ACTIVE" as const },
  { id: "AM007", playerId: "PLR005", associationId: "ASSOC02", isPrimary: false, status: "ACTIVE" as const },
];
const clubMemberships = [
  { id: "CM002", playerId: "PLR005", clubId: "CLB01", isPrimary: true, startDate: "2025-05-06", endDate: null, status: "ACTIVE" as const },
  { id: "CM102", playerId: "PLR005", clubId: "CLB02", isPrimary: false, startDate: "2026-05-05", endDate: null, status: "ACTIVE" as const },
  { id: "CM188", playerId: "PLR005", clubId: "CLB03", isPrimary: false, startDate: "2025-12-04", endDate: null, status: "ACTIVE" as const },
  { id: "CM210", playerId: "PLR005", clubId: "CLB11", isPrimary: false, startDate: "2025-02-10", endDate: null, status: "ACTIVE" as const },
];
const competitions = [
  { id: "COMP01", name: "Weekend Senior" },
  { id: "COMP05", name: "Night Tennis" },
];
const seasons = [
  { id: "SEA01", competitionId: "COMP01", year: 2025, seasonType: "Winter", status: "COMPLETED" as const },
  { id: "SEA03", competitionId: "COMP01", year: 2026, seasonType: "Winter", status: "ACTIVE" as const },
  { id: "SEA04", competitionId: "COMP05", year: 2026, seasonType: "Autumn", status: "COMPLETED" as const },
];
const sections = [
  { id: "SEC01", seasonId: "SEA01", name: "Section 1" },
  { id: "SEC03", seasonId: "SEA03", name: "Section 1" },
  { id: "SEC05", seasonId: "SEA04", name: "Section 1" },
];
const teams = [
  { id: "TEAM001", clubId: "CLB01", sectionId: "SEC01", name: "Glen Waverley A" },
  { id: "TEAM018", clubId: "CLB02", sectionId: "SEC03", name: "Mount Waverley A" },
  { id: "TEAM035", clubId: "CLB03", sectionId: "SEC05", name: "Syndal A" },
];
const teamPlayers = [
  { id: "TP0002", playerId: "PLR005", teamId: "TEAM001", status: "ACTIVE" },
  { id: "TP0106", playerId: "PLR005", teamId: "TEAM018", status: "ACTIVE" },
  { id: "TP0210", playerId: "PLR005", teamId: "TEAM035", status: "ACTIVE" },
];

// Join the rows the same way the backend will: Player → memberships, and TeamPlayer → Team → Section → Season → Competition.
export const mockMemberships: PlayerMemberships = {
  player: { id: player.id, displayName: `${player.firstName} ${player.lastName}` },
  associations: associationMemberships.filter(m => m.playerId === player.id).map(m => ({
    ...m, name: associations.find(a => a.id === m.associationId)!.name,
    startDate: null, endDate: null, // AssociationMembership has no start or end date in the workbook.
  })),
  clubs: clubMemberships.filter(m => m.playerId === player.id).map(m => {
    const club = clubs.find(c => c.id === m.clubId)!;
    return { ...m, name: club.name, associationId: club.associationId,
      associationName: associations.find(a => a.id === club.associationId)!.name };
  }),
  teams: teamPlayers.filter(m => m.playerId === player.id && m.status === "ACTIVE").map(m => {
    const team = teams.find(t => t.id === m.teamId)!;
    const section = sections.find(s => s.id === team.sectionId)!;
    const season = seasons.find(s => s.id === section.seasonId)!;
    const competition = competitions.find(c => c.id === season.competitionId)!;
    return { id: team.id, name: team.name, clubId: team.clubId, competitionName: competition.name,
      seasonLabel: `${season.seasonType} ${season.year}`, seasonStatus: season.status, sectionName: section.name };
  }),
};
