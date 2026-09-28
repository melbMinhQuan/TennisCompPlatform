import type { ReactNode } from "react";
import type { PlayerMemberships } from "../../api/memberships";
import MembershipBadge from "./MembershipBadge";
import { CLUB_CARD_CLASS, membershipDetail } from "./membership-helpers";

type AssociationSectionProps = {
  association: PlayerMemberships["associations"][number];
  /** The player's club cards that belong to this association. */
  clubCards: ReactNode[];
};

/** One association heading with its badge, followed by the player's clubs in it. */
export default function AssociationSection({ association, clubCards }: AssociationSectionProps) {
  return (
    <section className="space-y-3" aria-label={association.name}>
      <div className="flex flex-col items-start gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white [overflow-wrap:anywhere] md:text-[#1a3049]">
            {association.name}
          </h2>
          <p className="text-[13px] text-[#c4d3e5] md:text-muted">{membershipDetail(association)}</p>
        </div>
        <MembershipBadge primary={association.isPrimary} kind="ASSOCIATION" />
      </div>
      {clubCards.length ? (
        clubCards
      ) : (
        <p className={CLUB_CARD_CLASS + " text-center text-sm"}>No clubs recorded under this association yet.</p>
      )}
    </section>
  );
}
