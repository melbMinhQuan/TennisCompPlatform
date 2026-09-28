// Shared look for every player page (Profile, Competitions, Matches, My Clubs,
// Standings, Help). Change a style here and every page follows.
// Text colours are chosen to pass WCAG AA contrast on white and on the grey page background.

/** Page wrapper: 20px between cards, like the Profile page. */
export const pageClass = "min-w-0 space-y-5 text-[#1a3049]";

/** Page title: white on the mobile gradient, navy on the desktop grey. */
export const pageTitleClass =
  "text-[28px] font-semibold leading-tight text-white md:text-[32px] md:text-ink";

/** One-line intro under a page title. */
export const pageIntroClass =
  "mt-3 text-sm leading-6 text-white/85 min-[768px]:text-muted";

/** White card, same as the Profile page cards. */
export const matchCardClass = "min-w-0 rounded-2xl bg-white p-6";

/** Navy summary card. */
export const darkCardClass = "min-w-0 rounded-2xl bg-[#1a3049] p-6 text-white";

/** Tab button: filled blue when selected, light blue otherwise. */
export const tabClass = (selected: boolean) =>
  "min-h-11 flex-1 rounded-lg px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af] min-[768px]:flex-none "
  + (selected ? "bg-[#3f72af] text-white" : "bg-[#e8f0fa] text-[#1a3049] hover:bg-[#dce8f5]");

export const matchButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#3f72af] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#315e94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

export const matchLightButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#e8f0fa] px-5 py-3 text-sm font-medium text-[#1a3049] transition-colors hover:bg-[#dce8f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

export const matchLabelClass =
  "text-xs font-medium uppercase tracking-wide text-muted";

export const matchBadgeClass =
  "inline-flex rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#197354]";
