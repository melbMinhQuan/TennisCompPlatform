import { Link } from "react-router";
import type { ClubAdminDashboardData } from "../../data/club-admin-dashboard";
import { darkCardClass } from "../MatchesUI";

type ClubSummaryCardProps = {
  data: ClubAdminDashboardData;
  seasonId: string;
  onSeasonChange: (seasonId: string) => void;
  teamCount: number;
  attentionCount: number;
  unreadCount: number;
};

const TILE_CLASS =
  "flex h-full flex-col rounded-xl bg-white/[0.06] p-4 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Navy club summary: club name, season picker and four clickable figures. */
export default function ClubSummaryCard({ data, seasonId, onSeasonChange, teamCount, attentionCount, unreadCount }: ClubSummaryCardProps) {
  const season = data.seasons.find((item) => item.id === seasonId);
  const tiles = [
    { label: "Active club members", value: data.activeMembers, hint: "Across the whole club", to: "/club-admin/players" },
    { label: "Teams", value: teamCount, hint: season ? `${season.competition} · ${season.label}` : "Selected season", to: "/club-admin/teams" },
    {
      label: "Teams need attention",
      value: attentionCount,
      hint: attentionCount === 0 ? "All set" : "Missing a manager or players",
      hintClass: attentionCount === 0 ? "text-[#9fe0bd]" : "text-[#ffc98a]",
      to: "/club-admin/teams",
    },
    { label: "Unread notices", value: unreadCount, hint: "View notifications ›", to: "/club-admin/notifications" },
  ];

  return (
    <section className={darkCardClass} aria-labelledby="club-summary-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#bacbdf]">{data.club.associationName}</p>
          <h2 id="club-summary-heading" className="mt-1 text-2xl font-semibold [overflow-wrap:anywhere]">
            {data.club.name}
          </h2>
          <span className="mt-2 inline-flex rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-[#d3e0ee]">
            Club ID {data.club.id}
          </span>
        </div>
        <div className="w-full sm:w-auto sm:min-w-64">
          <label htmlFor="dashboard-season" className="mb-1 block text-xs text-[#bacbdf]">
            Showing teams for
          </label>
          <select
            id="dashboard-season"
            value={seasonId}
            onChange={(event) => onSeasonChange(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-white [&>option]:text-ink"
          >
            {data.seasons.map((item) => (
              <option key={item.id} value={item.id}>
                {item.competition} · {item.label}
                {item.status === "ACTIVE" ? " · Current" : " · Past"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link to={tile.to} className={TILE_CLASS}>
              <span className="text-xs text-[#bacbdf]">{tile.label}</span>
              <span className="mt-2 text-3xl font-semibold">{tile.value}</span>
              <span className={`mt-1 text-xs ${tile.hintClass ?? "text-[#bacbdf]"}`}>{tile.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
