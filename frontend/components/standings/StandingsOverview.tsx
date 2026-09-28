import { darkCardClass } from "../MatchesUI";

type StandingsOverviewProps = {
  playerName: string;
  teamPosition: string;
  playerPosition: string;
  utrRank: string;
};

/** Navy summary card: the player's team position, player position and UTR rank. */
export default function StandingsOverview({ playerName, teamPosition, playerPosition, utrRank }: StandingsOverviewProps) {
  const items = [
    ["Team position", teamPosition],
    ["Player position", playerPosition],
    ["UTR rank", utrRank],
  ];
  return (
    <section className={darkCardClass}>
      <p className="text-sm text-[#bacbdf]">{playerName}</p>
      <h2 className="mt-1 text-xl font-bold">Your competition overview</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-[#bacbdf]">{label}</dt>
            <dd className="mt-1 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
