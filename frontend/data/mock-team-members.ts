// Player + TeamPlayer rows from competition_data.xlsx. Only roster display fields.
const players: Record<string, string> = {
  PLR001: "Raj Mitchell", PLR002: "Mia Coleman", PLR003: "Yuki Smith",
  PLR004: "Charlotte Reed", PLR005: "Chloe Cooper", PLR006: "Ethan Wright",
  PLR007: "Ava Clark", PLR008: "Yuki Green", PLR009: "Elsa Hill", PLR010: "Hiro Parker",
};
const rosters: Record<string, { ids: string[] }> = {
  TEAM001: { ids: ["PLR006", "PLR005", "PLR004", "PLR003", "PLR002", "PLR001"] },
  TEAM018: { ids: ["PLR008", "PLR007", "PLR006", "PLR005", "PLR004", "PLR003"] },
  TEAM035: { ids: ["PLR010", "PLR009", "PLR008", "PLR007", "PLR006", "PLR005"] },
};

export function getMockTeamMembers(teamId: string, currentPlayerId: string) {
  const roster = rosters[teamId];
  return roster?.ids.map(id => ({ id, name: players[id], status: "ACTIVE" as const, isCurrentPlayer: id === currentPlayerId })) ?? [];
}
