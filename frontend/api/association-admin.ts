import type { Guardian } from "../components/junior/GuardianContact";
import type { SeasonStatus } from "../types/season";
import { ApiError, request } from "./client";

// Shapes from backend/src/association-admin/association-admin.types.ts.

/** A junior's place in a team of the association's competitions, with the age check for its section. */
export type AssociationJuniorTeam = {
  teamId: string;
  teamName: string;
  clubName: string;
  competitionName: string;
  seasonLabel: string;
  seasonStatus: SeasonStatus;
  /** The season's first day (YYYY-MM-DD), which the age check uses; null while it is not set. */
  seasonStart: string | null;
  sectionName: string;
  status: "ACTIVE" | "EMERGENCY" | "INACTIVE";
  /** The section's age limits, both inclusive; null where it sets none. */
  minAge: number | null;
  maxAge: number | null;
  ageOnSeasonStart: number | null;
  /** Null when there is nothing to check: no age limit, or no season start date. */
  eligible: boolean | null;
};

/** Every detail of one junior: the association's administrator checks age and eligibility. */
export type AssociationJunior = {
  id: string;
  code: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  status: string;
  email: string | null;
  phone: string | null;
  guardian: Guardian | null;
  clubs: { clubId: string; name: string; isPrimary: boolean; status: "ACTIVE" | "INACTIVE" }[];
  teams: AssociationJuniorTeam[];
};

export type AssociationJuniors = {
  /** Today in Melbourne, the day each `age` is for. */
  asOf: string;
  association: { id: string; name: string };
  adminName: string;
  juniors: AssociationJunior[];
};

const FAILED = "We couldn’t load the association’s juniors. Please try again.";

/**
 * GET /api/v1/association-admin/juniors as the signed-in association administrator (identified by
 * email, the same local demo lookup as the other pages). A refusal (403) keeps the server's message;
 * any other failure is replaced by a plain one.
 */
export async function getAssociationJuniors(signal: AbortSignal, identity?: string): Promise<AssociationJuniors> {
  if (!identity) throw new ApiError("Please log in again.", 401);
  const query = new URLSearchParams({ email: identity });
  try {
    return (await request<{ data: AssociationJuniors }>(`/api/v1/association-admin/juniors?${query}`, signal)).data;
  } catch (error) {
    if (signal.aborted || (error instanceof ApiError && error.status >= 400 && error.status < 500)) throw error;
    throw new ApiError(FAILED, error instanceof ApiError ? error.status : 0);
  }
}

/** "12 & under on 31 Oct 2026" style limit text for a section, or null when it has none. */
export function ageLimitLabel(team: Pick<AssociationJuniorTeam, "minAge" | "maxAge">) {
  if (team.minAge !== null && team.maxAge !== null) return `Ages ${team.minAge}–${team.maxAge}`;
  if (team.maxAge !== null) return `${team.maxAge} and under`;
  if (team.minAge !== null) return `${team.minAge} and over`;
  return null;
}
