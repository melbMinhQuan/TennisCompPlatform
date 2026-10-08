import { useContext } from "react";
import { getStandings } from "../api/standings";
import { useApiData } from "../api/useApiData";
import { PlayerSessionContext } from "../context/PlayerSession";
import { pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import StandingsContent from "../components/standings/StandingsContent";

export default function StandingsPage() {
  const { email } = useContext(PlayerSessionContext);
  const { data, error, retry } = useApiData(getStandings);
  return (
    <div className={`${pageClass} leading-[1.45]`}>
      <header>
        <h1 className={pageTitleClass}>Standings</h1>
        <p className={pageIntroClass}>
          Check your team's ladder position and player standings, this season and past ones.
        </p>
      </header>
      {!data ? <MatchLoadState error={error} retry={retry} /> : <StandingsContent key={email} data={data} />}
    </div>
  );
}
