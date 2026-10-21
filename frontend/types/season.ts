export type SeasonStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

/** A season still to be played: being played now, or not started yet. Anything else is past. */
export const isOpenSeason = (status: SeasonStatus | undefined) => status === "ACTIVE" || status === "UPCOMING";
