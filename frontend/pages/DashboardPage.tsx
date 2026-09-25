import PlayerProfile from "../components/PlayerProfile";
import type { PlayerProfileData } from "../components/PlayerProfile";
import { useContext } from "react";
import { Link } from "react-router";
import { PlayerSessionContext } from "../context/PlayerSession";
import NotificationPanel from "../components/NotificationPanel";
import UpcomingCompetition from "../components/UpcomingCompetition";
import RecentActivity from "../components/RecentActivity";
import PlayerRatings from "../components/PlayerRatings";

export default function DashboardPage() {
  const { email, data: apiData, loading, error, reload } =
    useContext(PlayerSessionContext);

  if (!email) {
    return (
      <div
        className="mx-auto max-w-6xl space-y-5 leading-[1.45] md:space-y-6 md:rounded-3xl md:bg-[#eff1f4] md:p-8"
      >
        {/* Page title */}
        <header className="space-y-2">
          <h1
            className="text-[28px] font-semibold text-white md:text-[34px] md:text-[#1a3049]"
          >
            Profile Dashboard
          </h1>

          <p
            className="text-sm text-white md:text-[#596b80]"
          >
            View your player profile, ratings, matches and competitions.
          </p>
        </header>

        {/* Login card */}
        <section
          className="rounded-2xl border border-[#dce4ee] bg-white p-6"
        >
          <h2 className="text-lg font-semibold text-[#1a3049]">
            Log in to see your profile
          </h2>

          <p className="mt-3 text-sm text-[#596b80]">
            Your player information and dashboard activity will appear here after
            you log in.
          </p>

          <Link
            to="/login"
            className="mt-4 inline-flex min-h-11 items-center
                      rounded-lg bg-[#1a3049] px-4 text-sm text-white
                      hover:bg-[#243f5d]"
          >
            Log in
          </Link>
        </section>

        <p className="text-[13px] text-white md:text-[#596b80]">
          Your profile information is managed by Waverley Tennis.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div role="status" className="rounded-2xl bg-white p-6">
        Loading your profile…
      </div>
    );
  }

  if (error || !apiData) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <p role="alert" className="text-red-700">
          {error || "Your profile could not be loaded."}
        </p>

        <button
          type="button"
          onClick={reload}
          className="mt-4 rounded-lg bg-[#1a3049] px-4 py-3 text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const data = apiData;
  const profile = data.profile;
  const status = profile.status;

  if (
    status !== "ACTIVE" &&
    status !== "INACTIVE" &&
    status !== "SUSPENDED"
  ) {
    return (
      <p role="alert" className="rounded-2xl bg-white p-6 text-red-700">
        The server returned an unsupported player status.
      </p>
    );
  }

  const player: PlayerProfileData = {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? undefined,
    status,
    age: profile.age,
    gender: profile.gender,
    email: profile.email,
    phone: profile.phone,
    clubs: profile.primaryClub ? [profile.primaryClub.name] : [],
    teams: profile.teams.map((team) => team.name),
    association: profile.primaryAssociation?.name ?? null,
    playerId: profile.id,
  };

  const upcomingCompetitions = data.upcomingMatches.items.map((match) => {
    const date = match.scheduledDate
      ? new Date(`${match.scheduledDate.slice(0, 10)}T00:00:00Z`)
      : null;

    const hasDate = date !== null && !Number.isNaN(date.getTime());

    return {
      id: match.id,

      month: hasDate
        ? date.toLocaleDateString("en-AU", {
            month: "short",
            timeZone: "UTC",
          }).toUpperCase()
        : "TBD",

      day: hasDate ? String(date.getUTCDate()) : "—",

      weekday: hasDate
        ? date.toLocaleDateString("en-AU", {
            weekday: "short",
            timeZone: "UTC",
          }).toUpperCase()
        : "",

      name: match.competition.name,

      event: [match.event || "Team fixture", match.round]
        .filter(Boolean)
        .join(" · "),

      location: "Not supplied",
      time: match.scheduledTime || "TBD",

      status:
        match.status === "CANCELLED"
          ? "Cancelled"
          : match.status === "COMPLETED"
            ? "Completed"
            : undefined,
    };
  });

  return (
    <div>
      <div
        className="grid min-w-0 grid-cols-1 items-start gap-5
                  min-[768px]:grid-cols-[200px_minmax(0,1fr)]
                  min-[1100px]:grid-cols-[220px_minmax(0,1fr)]"
      >
        <PlayerProfile player={player} />

        <div
          className="grid min-w-0 grid-cols-1 gap-5 min-[1400px]:grid-cols-2"
        >
          {/* Top left */}
          <PlayerRatings rating={data.utr.rating} />

          {/* Top right */}
          <NotificationPanel />

          {/* Bottom left */}
          <RecentActivity
            matches={data.recentMatches.items}
            available={data.recentMatches.available}
            careerSummary={data.careerSummary}
          />

          {/* Bottom right */}
          {data.upcomingMatches.available ? (
            <UpcomingCompetition competitions={upcomingCompetitions} />
          ) : (
            <section className="min-w-0 rounded-[32px] bg-white p-6">
              <h2 className="text-xl font-semibold">Upcoming Competition</h2>
              <p role="status" className="mt-6 text-sm text-slate-500">
                Upcoming competitions are currently unavailable.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
