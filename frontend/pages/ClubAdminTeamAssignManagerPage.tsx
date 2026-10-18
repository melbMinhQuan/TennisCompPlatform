import { useCallback, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import { getClubPlayers, type ClubPlayer } from "../api/club-admin-players";
import { assignTeamManager, getClubTeam } from "../api/club-admin-teams";
import { useClubAdminData } from "../api/useApiData";
import { useClubAdminAction } from "../api/useClubAdminAction";
import MatchLoadState from "../components/MatchLoadState";
import {
  matchButtonClass,
  matchCardClass,
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";

// A user has one role, so holding any of these rules them out (HOLDS_ANOTHER_ROLE).
const OTHER_ROLES: Record<string, string> = {
  ADMINISTRATOR: "Association administrator",
  RECORDS_SECRETARY: "Records secretary",
  CLUB_ADMIN: "Club administrator",
  PUBLIC: "Public account",
};

export default function ClubAdminTeamAssignManagerPage() {
  const { teamId = "" } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  // The team (current manager and squad) and the club's members, who are the only candidates.
  const loadTeam = useCallback(
    (signal: AbortSignal, identity?: string) => getClubTeam(teamId, signal, identity),
    [teamId],
  );
  const teamData = useClubAdminData(loadTeam);
  const playersData = useClubAdminData(getClubPlayers);
  const team = teamData.data;
  const action = useClubAdminAction();

  /**
   * Why a player can't manage this team, matching the backend's rules: a login account, one role
   * per user, and one team at a time while that team's season is upcoming or active. "" means they can.
   */
  function blockedReason(player: ClubPlayer) {
    if (!player.hasLogin) return "No login account";
    if (player.role && OTHER_ROLES[player.role]) return `Holds another role (${OTHER_ROLES[player.role]})`;
    if (player.managedTeam && player.managedTeam.id !== teamId) return `Already manages ${player.managedTeam.name}`;
    return "";
  }

  const currentManagerId = team?.manager?.playerId ?? undefined;

  const candidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (playersData.data ?? [])
      .filter(
        (player) =>
          player.status === "ACTIVE" &&
          player.membership.status === "ACTIVE" &&
          (!query ||
            `${player.firstName} ${player.lastName}`
              .toLowerCase()
              .includes(query) ||
            player.id.toLowerCase().includes(query))
      )
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      );
  }, [search, playersData.data]);

  if (team === undefined || !playersData.data) {
    return <MatchLoadState error={teamData.error ?? playersData.error} retry={() => { teamData.retry(); playersData.retry(); }} />;
  }

  if (!team) {
    return (
      <section className="text-white md:text-[#1a3049]">
        <h1 className="text-2xl font-bold">Team not found</h1>
        <Link to="/club-admin/teams" className="underline">
          Back to teams
        </Link>
      </section>
    );
  }

  const targetTeamId = team.id;
  const detailPath = `/club-admin/teams/${targetTeamId}`;
  const selectedManagerId = selectedId || currentManagerId || "";
  const squadPlayerIds = new Set(
    team.players
      .filter((teamPlayer) => teamPlayer.status === "ACTIVE")
      .map((teamPlayer) => teamPlayer.id)
  );
  const selectedPlayer = candidates.find((player) => player.id === selectedManagerId);

  async function handleAssign() {
    if (!selectedPlayer || blockedReason(selectedPlayer)) return;

    const updated = await action.run((email, signal) => assignTeamManager(targetTeamId, selectedPlayer.id, email, signal));
    if (!updated) return;
    navigate(detailPath, {
      state: { managerUpdated: true },
    });
  }

  return (
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">
        Teams / {team.name} / Assign manager
      </p>

      <Link
        to={detailPath}
        className={`${matchLightButtonClass} mt-5`}
      >
        ‹ Back to team
      </Link>

      <h1 className={`mt-6 ${pageTitleClass}`}>
        Assign manager
      </h1>

      <p className="mt-3 text-sm text-[#d2dfed] md:text-muted">
        Choose an active member of your club. A manager needs a
        login account, can manage one current team at a time, and
        can’t hold another role such as club administrator.
      </p>

      <div className={`mt-5 text-[#1a3049] ${matchCardClass}`}>
        <label
          htmlFor="team-manager-search"
          className="text-sm font-semibold"
        >
          Search players
        </label>

        <input
          id="team-manager-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or Player ID"
          className="mt-2 min-h-11 w-full rounded-lg border border-[#c8d8e9] px-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
        />

        <div className="mt-5 border-b border-[#dbe4ef] pb-3">
          <h2 className="font-bold">
            Choose one person ({candidates.length})
          </h2>
        </div>

        <div className="max-h-[480px] overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="py-6 text-sm text-muted">
              No eligible players found.
            </p>
          ) : (
            candidates.map((player) => {
              const reason = blockedReason(player);
              return (
              <label
                key={player.id}
                className={`flex items-center gap-3 border-b border-[#e4eaf2] py-4 last:border-0 ${reason ? "opacity-65" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="team-manager"
                  disabled={Boolean(reason)}
                  value={player.id}
                  checked={selectedManagerId === player.id}
                  onChange={() => setSelectedId(player.id)}
                  className="h-4 w-4 accent-[#3f72af]"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-xs text-muted">
                    {player.id} ·{" "}
                    {reason ||
                      (squadPlayerIds.has(player.id)
                        ? "In this squad"
                        : "Club member")}
                  </p>
                </div>

                {player.id === currentManagerId && (
                  <span className="rounded-md bg-[#e8f0fa] px-2.5 py-1 text-xs font-semibold text-[#1a3049]">
                    Current manager
                  </span>
                )}
              </label>
              );
            })
          )}
        </div>

        {action.error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {action.error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to={detailPath}
            className={matchLightButtonClass}
          >
            Cancel
          </Link>

          <button
            type="button"
            disabled={
              !selectedPlayer ||
              Boolean(blockedReason(selectedPlayer)) ||
              action.busy
            }
            onClick={() => void handleAssign()}
            className={`${matchButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Assign manager
          </button>
        </div>
      </div>
    </section>
  );
}
