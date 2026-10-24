
import { useCallback, useContext, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getClubTeam, removeTeamManager, removeTeamPlayer } from "../api/club-admin-teams";
import { useClubAdminData } from "../api/useApiData";
import { useClubAdminAction } from "../api/useClubAdminAction";
import { RoleSessionContext } from "../context/RoleSession";
import MatchLoadState from "../components/MatchLoadState";
import {
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";
import ClubTeamDetailContent from "../components/club-admin/teams/ClubTeamDetailContent";

const secondary = matchLightButtonClass;

export default function ClubAdminTeamDetailPage() {
  const { teamId = "" } = useParams<{ teamId: string }>();
  const [showAll, setShowAll] = useState(false);
  const location = useLocation();
  const clubName = useContext(RoleSessionContext).signedIn?.clubName ?? "your club";

  // The team with its roster and manager. Each change answers with the team as it now is.
  const load = useCallback(
    (signal: AbortSignal, identity?: string) => getClubTeam(teamId, signal, identity),
    [teamId],
  );
  const { data: team, error, retry, setData } = useClubAdminData(load);
  const action = useClubAdminAction();
  // Which card a failed change belongs to, so its message shows there.
  const [failedIn, setFailedIn] = useState<"squad" | "manager" | null>(null);

  const [showRemoveConfirm, setShowRemoveConfirm] =
    useState(false);

  const [managerRemoved, setManagerRemoved] =
    useState(false);
  const [playerToRemove, setPlayerToRemove] =
    useState<string | null>(null);
  const [removedPlayerName, setRemovedPlayerName] =
    useState<string | null>(null);

  const managerUpdated = Boolean(
    (location.state as { managerUpdated?: boolean } | null)
      ?.managerUpdated
  );

  if (team === undefined) return <MatchLoadState error={error} retry={retry} />;

  if (!team) {
    return (
      <section className="text-white md:text-[#1a3049]">
        <h1 className={pageTitleClass}>
          Team not found
        </h1>
        <p className="mt-3 text-sm">
          This team does not exist or does not belong
          to {clubName}.
        </p>
        <Link
          to="/club-admin/teams"
          className={`${secondary} mt-5`}
        >
          ‹ Teams
        </Link>
      </section>
    );
  }

	// Keep ACTIVE squad places in API order; identify the manager by Player ID.
  const squad = team.players.filter((player) => player.status === "ACTIVE");
  const manager = team.manager;
  const managerName = manager?.name ?? null;
  const managerId = manager?.playerId ?? null;
  const playerPendingRemoval = squad.find(
    (player) => player.id === playerToRemove
  );

  const visibleSquad = showAll ? squad : squad.slice(0, 3);
  const remaining = squad.length - visibleSquad.length;

  const removePlayer = async () => {
    const player = playerPendingRemoval;
    if (!player) {
      setPlayerToRemove(null);
      return;
    }
    setFailedIn("squad");
    setRemovedPlayerName(null);
    const updated = await action.run((email, signal) => removeTeamPlayer(team.id, player.id, email, signal));
    setPlayerToRemove(null);
    if (!updated) return;
    setData(() => updated);
    setRemovedPlayerName(`${player.firstName} ${player.lastName}`);
  };

  const removeManager = async () => {
    setFailedIn("manager");
    const updated = await action.run((email, signal) => removeTeamManager(team.id, email, signal));
    setShowRemoveConfirm(false);
    if (!updated) return;
    setData(() => updated);
    setManagerRemoved(true);
  };

	return (
		<ClubTeamDetailContent
			team={team}
			squadCount={squad.length}
			managerName={managerName}
			squad={{
				teamId: team.id,
				squadCount: squad.length,
				visibleSquad,
				managerId,
				showAll,
				remaining,
				removedPlayerName,
				error: failedIn === "squad" ? action.error : "",
				onRemovePlayer: setPlayerToRemove,
				onToggleShowAll: () => setShowAll(!showAll),
			}}
			manager={{
				teamId: team.id,
				manager,
				managerUpdated,
				managerRemoved,
				error: failedIn === "manager" ? action.error : "",
				onRemoveManager: () => setShowRemoveConfirm(true),
			}}
			playerDialog={playerToRemove ? {
				teamName: team.name,
				playerName: playerPendingRemoval
					? `${playerPendingRemoval.firstName} ${playerPendingRemoval.lastName}`
					: "this player",
				busy: action.busy,
				onCancel: () => setPlayerToRemove(null),
				onConfirm: () => void removePlayer(),
			} : null}
			managerDialog={showRemoveConfirm ? {
				teamName: team.name,
				managerName,
				busy: action.busy,
				onCancel: () => setShowRemoveConfirm(false),
				onConfirm: () => void removeManager(),
			} : null}
		/>
	);
}
