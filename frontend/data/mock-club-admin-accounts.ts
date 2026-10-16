// Temporary, until POST /auth/login returns the role. These are the 12 CLUB_ADMIN rows from the
// UserRole sheet of backend/prisma/competition_data.xlsx, as login email → seeded club UUID.
// Only used to choose which dashboard to open after a successful login; it is not a security check.
export const mockClubAdminAccounts: Record<string, string> = {
  "margaret.hayes@admin.example": "CLB01",
  "peter.lawson@admin.example": "CLB02",
  "susan.fraser@admin.example": "CLB03",
  "graham.doyle@admin.example": "CLB04",
  "karen.whitfield@admin.example": "CLB05",
  "andrew.sinclair@admin.example": "CLB06",
  "helen.marsh@admin.example": "CLB07",
  "robert.keane@admin.example": "CLB08",
  "julie.prentice@admin.example": "CLB09",
  "stephen.hale@admin.example": "CLB10",
  "linda.ashford@admin.example": "CLB11",
  "michael.dunstan@admin.example": "CLB12",
};
