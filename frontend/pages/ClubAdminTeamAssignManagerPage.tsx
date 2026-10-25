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
import TeamManagerSelection from "../components/club-admin/teams/TeamManagerSelection";
import MatchLoadState from "../components/MatchLoadState";
import {
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";
import { displayId } from "../utils/formatters";

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
   * Why a player can't manage this team, matching the backend's rules: an adult (a manager sees every
   * junior's parent contact), a login account, one role per user, and one team at a time while that
   * team's season is upcoming or active. "" means they can.
   */
  function blockedReason(player: ClubPlayer) {
    if (player.isJunior) return "Under 18";
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
            displayId(player).toLowerCase().includes(query))
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

			<TeamManagerSelection
				search={search}
				candidates={candidates}
				selectedManagerId={selectedManagerId}
				currentManagerId={currentManagerId}
				squadPlayerIds={squadPlayerIds}
				blockedReason={blockedReason}
				error={action.error}
				assignDisabled={
					!selectedPlayer ||
					Boolean(blockedReason(selectedPlayer)) ||
					action.busy
				}
				detailPath={detailPath}
				onSearchChange={setSearch}
				onSelectManager={setSelectedId}
				onAssign={handleAssign}
			/>
    </section>
  );
}
