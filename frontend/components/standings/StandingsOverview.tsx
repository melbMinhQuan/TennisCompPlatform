import { darkCardClass } from "../MatchesUI";

type StandingsOverviewProps = {
  playerName: string;
  teamPosition: string;
  playerPosition: string;
};

/** Navy summary card for Waverley Tennis team and player standings. */
export default function StandingsOverview({ playerName, teamPosition, playerPosition }: StandingsOverviewProps) {
  const items = [
    ["Team position", teamPosition],
    ["Player position", playerPosition],
  ];
  return (
    <section className={darkCardClass}>
      <p className="text-sm text-[#bacbdf]">{playerName}</p>
      <div className="mt-1">
        <h2 className="text-xl font-bold">Your competition standings</h2>
        <p className="mt-1 text-xs text-[#bacbdf]">From Waverley Tennis match results</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[#bacbdf]">{label}</dt>
              <dd className="mt-1 text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
