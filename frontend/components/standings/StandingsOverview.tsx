import { darkCardClass } from "../MatchesUI";

type StandingsOverviewProps = {
  playerName: string;
  teamPosition: string;
  playerPosition: string;
  utrRank: string;
};

/**
 * Navy summary card. Waverley Tennis standings (team and player position) and the UTR rank
 * are kept in separate, labelled parts so players don't read UTR as a competition ranking.
 */
export default function StandingsOverview({ playerName, teamPosition, playerPosition, utrRank }: StandingsOverviewProps) {
  const items = [
    ["Team position", teamPosition],
    ["Player position", playerPosition],
  ];
  return (
    <section className={darkCardClass}>
      <p className="text-sm text-[#bacbdf]">{playerName}</p>
      <div className="mt-1 grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
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
        <div className="min-w-0 border-t border-[#3f72af] pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
          <h2 className="text-xl font-bold">Your UTR</h2>
          <p className="mt-1 text-xs text-[#bacbdf]">Source: Universal Tennis</p>
          <dl className="mt-4">
            <dt className="text-xs text-[#bacbdf]">UTR rank</dt>
            <dd className="mt-1 text-sm font-semibold [overflow-wrap:anywhere]">{utrRank}</dd>
          </dl>
        </div>
      </div>
    </section>
  );
}
