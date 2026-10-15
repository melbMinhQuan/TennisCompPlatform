
export type PlayerStatus = "ACTIVE" | "INACTIVE";

export type MembershipStatus = "ACTIVE" | "INACTIVE";

export type TeamPlayerStatus =
  | "ACTIVE"
  | "EMERGENCY"
  | "INACTIVE";

export interface ClubAdminPlayer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  status: PlayerStatus;
}

export interface ClubAdminClub {
  id: string;
  name: string;
}

export interface ClubAdminMembership {
  id: string;
  playerId: string;
  clubId: string;
  isPrimary: boolean;
  status: MembershipStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface ClubAdminTeam {
  id: string;
  clubId: string;
  sectionId: string;
  name: string;
}

export interface ClubAdminTeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  status: TeamPlayerStatus;
  registerAt: string | null;
}
