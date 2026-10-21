/**
 * Marks a player under 18. Shown only to people allowed to know who is a junior: the junior,
 * their team's manager, their club's administrator and the association (docs/junior-privacy.md).
 * Teammates and other clubs never see it.
 */
export default function JuniorBadge() {
  return (
    <span className="ml-2 inline-block rounded-md bg-[#fff1df] px-2 py-0.5 align-middle text-xs font-semibold text-[#a45c14]">
      Junior
    </span>
  );
}
