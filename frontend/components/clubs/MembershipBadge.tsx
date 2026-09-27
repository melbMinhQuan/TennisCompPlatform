/** "PRIMARY CLUB", "ADDITIONAL ASSOCIATION", etc. */
export default function MembershipBadge({ primary, kind }: { primary: boolean; kind: string }) {
  return (
    <span className="inline-block shrink-0 rounded-md bg-[#e5f4ec] px-5 py-2.5 text-center text-xs font-semibold text-[#197354]">
      {primary ? "PRIMARY" : "ADDITIONAL"} {kind}
    </span>
  );
}
