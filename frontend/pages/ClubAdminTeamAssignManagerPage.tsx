import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import {
  mockTeams,
  mockPlayers,
  mockClubMemberships,
} from "../data/mock-club-admin-players";
import {
  assignTeamManager,
  useTeamManagers,
} from "../data/teamManagerStore";
import { useTeamPlayers } from "../data/teamSquadStore";
import {
  matchButtonClass,
  matchCardClass,
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";

const CLUB_ID = "CLB01";

export default function ClubAdminTeamAssignManagerPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const managers = useTeamManagers();
  const teamPlayers = useTeamPlayers();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const team = mockTeams.find(
    (item) => item.id === teamId && item.clubId === CLUB_ID
  );

  const currentManagerId = teamId
    ? managers[teamId]
    : undefined;

  const candidates = useMemo(() => {
    const activeClubPlayerIds = new Set(
      mockClubMemberships
        .filter(
          (membership) =>
            membership.clubId === CLUB_ID &&
            membership.status === "ACTIVE"
        )
        .map((membership) => membership.playerId)
    );
    const query = search.trim().toLowerCase();

    return mockPlayers
      .filter(
        (player) =>
          player.status === "ACTIVE" &&
          activeClubPlayerIds.has(player.id) &&
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
  }, [search]);

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
    teamPlayers
      .filter(
        (teamPlayer) =>
          teamPlayer.teamId === targetTeamId &&
          teamPlayer.status === "ACTIVE"
      )
      .map((teamPlayer) => teamPlayer.playerId)
  );

  function handleAssign() {
    const isEligible = candidates.some(
      (player) => player.id === selectedManagerId
    );

    if (!isEligible) return;

    assignTeamManager(targetTeamId, selectedManagerId);
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
        Select an active player who is an active member of
        this club. Eligible indicates basic demo criteria;
        manager role and permission rules may differ in the
        future.
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
            candidates.map((player) => (
              <label
                key={player.id}
                className="flex cursor-pointer items-center gap-3 border-b border-[#e4eaf2] py-4 last:border-0"
              >
                <input
                  type="radio"
                  name="team-manager"
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
                    {squadPlayerIds.has(player.id)
                      ? "In this squad"
                      : "Club member"}
                  </p>
                </div>

                {player.id === currentManagerId && (
                  <span className="rounded-md bg-[#e8f0fa] px-2.5 py-1 text-xs font-semibold text-[#1a3049]">
                    Current manager
                  </span>
                )}
              </label>
            ))
          )}
        </div>

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
              !selectedManagerId ||
              !candidates.some(
                (player) => player.id === selectedManagerId
              )
            }
            onClick={handleAssign}
            className={`${matchButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Assign manager
          </button>
        </div>
      </div>
    </section>
  );
}
