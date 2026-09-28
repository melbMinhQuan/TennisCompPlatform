import { darkCardClass } from "../MatchesUI";

type MembershipSummaryProps = {
  playerName: string;
  primaryAssociationName?: string;
  counts: { associations: number; clubs: number; teams: number };
};

/** Navy card: player name, primary association, and association / club / team counts. */
export default function MembershipSummary({ playerName, primaryAssociationName, counts }: MembershipSummaryProps) {
  const items: [string, number][] = [
    ["Associations", counts.associations],
    ["Clubs", counts.clubs],
    ["Teams", counts.teams],
  ];
  return (
    <section
      aria-label="Membership summary"
      className={`${darkCardClass} flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between`}
    >
      <div className="min-w-0 text-center xl:text-left">
        <h2 className="text-xl font-bold [overflow-wrap:anywhere]">{playerName}</h2>
        <p className="mt-1 text-[13px] text-[#bacbdf]">
          Player{primaryAssociationName ? " · primary association: " + primaryAssociationName : ""}
        </p>
      </div>
      <dl className="grid shrink-0 grid-cols-3 divide-x divide-[#3f72af] text-center">
        {items.map(([label, count]) => (
          <div key={label} className="px-2 sm:px-5">
            <dd className="text-3xl font-bold">{count}</dd>
            <dt className="mt-0.5 text-[10px] font-medium uppercase text-[#bacbdf]">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
