import { useContext } from "react";
import { PlayerSessionContext } from "../context/PlayerSession";
import { getFixtures, getResults } from "../api/matches";
import { useApiData } from "../api/useApiData";
import { MOCK_CAREER_SUMMARY, MOCK_PLAYER, MOCK_UTR_RATING } from "../data/mock-profile";
import { MOCK_NOTIFICATIONS } from "../data/mock-notifications";
import PlayerProfile from "../components/PlayerProfile";
import NotificationPanel from "../components/NotificationPanel";
import UpcomingCompetition from "../components/UpcomingCompetition";
import RecentActivity from "../components/RecentActivity";
import PlayerRatings from "../components/PlayerRatings";
import { matchButtonClass, matchCardClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import { toPlayerProfile, toUpcomingCompetitions } from "../components/profile/profile-mappers";

const KNOWN_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function DashboardPage() {
  const { email, data: apiData, loading, error, reload } = useContext(PlayerSessionContext);
  const fixtures = useApiData(getFixtures);
  const results = useApiData(getResults);

  if (email && loading) {
    return (
      <div role="status" className={matchCardClass}>
        Loading your profile…
      </div>
    );
  }

  if (email && (error || !apiData)) {
    return (
      <div className={matchCardClass}>
        <p role="alert" className="text-red-700">
          {error || "Your profile could not be loaded."}
        </p>
        <button type="button" onClick={reload} className={`${matchButtonClass} mt-4`}>
          Try again
        </button>
      </div>
    );
  }

  const profile = apiData?.profile;
  if (profile && !KNOWN_STATUSES.includes(profile.status)) {
    return (
      <p role="alert" className={`${matchCardClass} text-red-700`}>
        The server returned an unsupported player status.
      </p>
    );
  }

  // Logged out: show the sample player. Logged in: show the API profile.
  const player = profile ? toPlayerProfile(profile) : MOCK_PLAYER;

  return (
    <div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 min-[768px]:grid-cols-[200px_minmax(0,1fr)] min-[1100px]:grid-cols-[220px_minmax(0,1fr)]">
        <PlayerProfile player={player} />

        <div className="grid min-w-0 grid-cols-1 gap-5 min-[1400px]:grid-cols-2">
          <PlayerRatings rating={apiData ? apiData.utr.rating : MOCK_UTR_RATING} />

          <NotificationPanel
            notifications={apiData ? apiData.notifications.items : MOCK_NOTIFICATIONS}
            hasMore={apiData?.notifications.hasMore ?? false}
          />

          {results.loading || results.error ? (
            <MatchLoadState error={results.error} retry={results.retry} />
          ) : (
            <RecentActivity
              matches={[...(results.data ?? [])].sort((a, b) => b.date.localeCompare(a.date))}
              available={!results.error}
              careerSummary={apiData?.careerSummary ?? MOCK_CAREER_SUMMARY}
            />
          )}

          {fixtures.loading || fixtures.error ? (
            <MatchLoadState error={fixtures.error} retry={fixtures.retry} />
          ) : (
            <UpcomingCompetition competitions={toUpcomingCompetitions(fixtures.data ?? [])} />
          )}
        </div>
      </div>
    </div>
  );
}
