
import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import {
  mockTeams,
  mockPlayers,
} from "../data/mock-club-admin-players";
import {
  removePlayerFromTeam,
  useTeamPlayers,
} from "../data/teamSquadStore";
import {
  useTeamManagers,
  removeTeamManager,
} from "../data/teamManagerStore";
import {
  matchButtonClass,
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";

const CLUB_ID = "CLB01";

const button = matchButtonClass;
const secondary = matchLightButtonClass;

export default function ClubAdminTeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [showAll, setShowAll] = useState(false);
  const managers = useTeamManagers();
  const location = useLocation();

  const [showRemoveConfirm, setShowRemoveConfirm] =
    useState(false);

  const [managerRemoved, setManagerRemoved] =
    useState(false);
  const [playerToRemove, setPlayerToRemove] =
    useState<string | null>(null);
  const [removedPlayerName, setRemovedPlayerName] =
    useState<string | null>(null);

  const managerId = teamId
    ? managers[teamId]
    : undefined;

  const manager = mockPlayers.find(
    (player) => player.id === managerId
  );

  const managerName = manager
    ? `${manager.firstName} ${manager.lastName}`
    : null;

  const managerUpdated = Boolean(
    (location.state as { managerUpdated?: boolean } | null)
      ?.managerUpdated
  );

  const teamPlayers = useTeamPlayers();

  const team = mockTeams.find(
    (item) => item.id === teamId && item.clubId === CLUB_ID
  );

  const squad = useMemo(() => {
    if (!team) return [];

    const playerById = new Map(
      mockPlayers.map((player) => [player.id, player])
    );

    const activePlayerIds = [
      ...new Set(
        teamPlayers
          .filter(
            (item) =>
              item.teamId === team.id &&
              item.status === "ACTIVE"
          )
          .map((item) => item.playerId)
      ),
    ];

    return activePlayerIds
      .map((id) => playerById.get(id))
      .filter((player) => player !== undefined)
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      );
  }, [team, teamPlayers]);
  const playerPendingRemoval = squad.find(
    (player) => player.id === playerToRemove
  );

  if (!team) {
    return (
      <section className="text-white md:text-[#1a3049]">
        <h1 className={pageTitleClass}>
          Team not found
        </h1>
        <p className="mt-3 text-sm">
          This team does not exist or does not belong
          to Glen Waverley Tennis Club.
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

  const visibleSquad = showAll ? squad : squad.slice(0, 3);
  const remaining = squad.length - visibleSquad.length;

  return (
    <section className="text-white md:text-[#1a3049]">
      {/* Breadcrumb */}
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">
        Teams&nbsp; / &nbsp;{team.name}
      </p>

      {/* Back */}
      <Link
        to="/club-admin/teams"
        className={`${secondary} mt-5`}
      >
        ‹ Teams
      </Link>

      {/* Heading */}
      <h1 className={`mt-6 ${pageTitleClass}`}>
        {team.name}
      </h1>

      <p className="mt-4 text-sm text-[#d2dfed] md:text-base md:text-muted">
        Section {team.sectionId.replace(/^SEC0*/, "")}
        {" · "}
        Team ID {team.id}
      </p>

      {/* Team Summary */}
      <div className="mt-5 rounded-2xl bg-[#1c334f] p-5 text-white md:p-6">
        <h2 className="text-lg font-bold">
          Team summary
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-bold">
              {squad.length}
            </p>
            <p className="text-sm text-[#b8c9dc]">
              Players in squad
            </p>
          </div>

          <div>
            <div>
              <p className="text-xl font-bold">
                {managerName ?? "Not assigned"}
              </p>
              <p className="text-sm text-[#b8c9dc]">
                Team manager
              </p>
            </div>
          </div>

          <div>
            <p className="text-xl font-bold">
              Not available
            </p>
            <p className="text-sm text-[#b8c9dc]">
              Next match
            </p>
          </div>
        </div>
      </div>

      {/* Squad */}
      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            Squad ({squad.length})
          </h2>

          <Link
            to={`/club-admin/teams/${team.id}/add-players`}
            className={button}
          >
            + Add players
          </Link>
        </div>

        <div className="mt-4 border-t border-[#dbe4ef]">
          {squad.length === 0 ? (
            <p className="py-6 text-sm text-muted">
              No active players in this squad.
            </p>
          ) : (
            visibleSquad.map((player) => (
              <div
                key={player.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe4ef] py-4"
              >
                <div>
                  <p className="font-semibold">
                    {player.firstName} {player.lastName}
                  </p>

                  <p className="mt-0.5 text-sm text-muted">
                    {player.id}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-[#e4f5ec] px-2.5 py-1 text-xs font-semibold text-[#187650]">
                    In squad
                  </span>
                  {player.id === managerId && (
                    <span className="rounded-md bg-[#e8f0fa] px-2.5 py-1 text-xs font-semibold text-[#1a3049]">
                      Team manager
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setPlayerToRemove(player.id)}
                    className="text-sm font-medium text-[#b53b3b] hover:underline focus-visible:outline-2 focus-visible:outline-[#b53b3b]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {squad.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="mt-4 text-sm font-medium text-[#3f72af] hover:underline focus-visible:outline-2 focus-visible:outline-[#3f72af]"
          >
            {showAll
              ? "Show less"
              : `+ ${remaining} more players`}
          </button>
        )}

        {removedPlayerName && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-[#e4f5ec] p-3 text-sm text-[#187650]"
          >
            {removedPlayerName} was removed from the squad.
          </p>
        )}
      </div>

      {playerToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-player-title"
            aria-describedby="remove-player-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-[#1a3049] shadow-xl"
          >
            <h2
              id="remove-player-title"
              className="text-xl font-bold"
            >
              Remove player from squad?
            </h2>

            <p
              id="remove-player-description"
              className="mt-3 text-sm leading-6 text-muted"
            >
              Remove{" "}
              <strong>
                {playerPendingRemoval
                  ? `${playerPendingRemoval.firstName} ${playerPendingRemoval.lastName}`
                  : "this player"}
              </strong>{" "}
              from {team.name}? This will not end their club
              membership.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPlayerToRemove(null)}
                className={secondary}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const player = playerPendingRemoval;
                  if (!player) {
                    setPlayerToRemove(null);
                    return;
                  }

                  removePlayerFromTeam(team.id, player.id);
                  setRemovedPlayerName(
                    `${player.firstName} ${player.lastName}`
                  );
                  setPlayerToRemove(null);
                }}
                className="min-h-11 rounded-lg bg-[#b53b3b] px-5 text-sm font-medium text-white hover:bg-[#963030]"
              >
                Remove player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Manager */}
      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <h2 className="text-lg font-bold">
          Team manager
        </h2>

        {manager ? (
          <>
            <div className="mt-4 rounded-xl bg-[#f2f6fb] p-4">
              <p className="text-lg font-semibold">
                {manager.firstName} {manager.lastName}
              </p>
              <p className="mt-1 text-sm text-muted">
                Player ID: {manager.id}
              </p>
              <p className="mt-1 text-sm text-muted">
                {manager.email}
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              This manager is assigned to this team only.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/club-admin/teams/${team.id}/manager`}
                className={secondary}
              >
                Change manager
              </Link>

              <button
                type="button"
                onClick={() => setShowRemoveConfirm(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#dfb8b8] px-5 text-sm font-medium text-[#b53b3b] hover:bg-[#fff1f1]"
              >
                Remove manager
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-muted">
              No manager is currently assigned to this team.
              Assign an eligible club member to manage
              the team's squad and match information.
            </p>

            <Link
              to={`/club-admin/teams/${team.id}/manager`}
              className={`${button} mt-4`}
            >
              + Assign manager
            </Link>
          </>
        )}

        {managerUpdated && manager && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-[#e4f5ec] p-3 text-sm text-[#187650]"
          >
            Team manager updated successfully.
          </p>
        )}

        {managerRemoved && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-[#e4f5ec] p-3 text-sm text-[#187650]"
          >
            Team manager removed successfully.
          </p>
        )}
      </div>

      {/* Remove Manager Confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-manager-title"
            aria-describedby="remove-manager-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-[#1a3049] shadow-xl"
          >
            <h2
              id="remove-manager-title"
              className="text-xl font-bold"
            >
              Remove team manager?
            </h2>

            <p
              id="remove-manager-description"
              className="mt-3 text-sm leading-6 text-muted"
            >
              Are you sure you want to remove{" "}
              <strong>{managerName}</strong> as manager
              of {team.name}?
            </p>

            <p className="mt-2 text-sm text-muted">
              This will not remove them from the club
              or from the team squad.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className={secondary}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  removeTeamManager(team.id);
                  setShowRemoveConfirm(false);
                  setManagerRemoved(true);
                }}
                className="min-h-11 rounded-lg bg-[#b53b3b] px-5 text-sm font-medium text-white hover:bg-[#963030]"
              >
                Remove manager
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
