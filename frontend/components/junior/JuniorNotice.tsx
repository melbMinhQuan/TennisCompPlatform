/** Who is reading, which decides what the notice explains (docs/junior-privacy.md). */
export type JuniorAudience = "self" | "manager" | "club" | "registry" | "association";

const TEXT: Record<JuniorAudience, string> = {
  self:
    "You are registered as a junior. Your date of birth, phone and email are seen only by you, your club and the association. " +
    "Your team manager sees your parent or guardian's contact to arrange matches; other players see only your name.",
  manager:
    "As team manager you can see the parent or guardian's phone and email for each junior, to arrange matches. " +
    "Please use them only for that. Teammates see names only.",
  club:
    "This player is a junior. Only your club and the association can see their details. " +
    "Other clubs see only their name, and their team manager sees only the parent or guardian's contact.",
  registry:
    "Juniors from other clubs show their name only. The tick or cross says whether the date of birth and email you typed match the record; " +
    "the record itself is never shown.",
  association:
    "Juniors' details are shown in full so you can check age and eligibility. Each age is taken on the season's first day.",
};

/** A short explanation of who can see a junior's details, shown wherever junior details appear. */
export default function JuniorNotice({ audience, className = "" }: { audience: JuniorAudience; className?: string }) {
  return (
    <p role="note" className={`rounded-xl border border-[#f3d3a8] bg-[#fff8ef] px-4 py-3 text-sm leading-6 text-[#7a4510] ${className}`}>
      <span className="font-semibold">Junior privacy: </span>
      {TEXT[audience]}
    </p>
  );
}
