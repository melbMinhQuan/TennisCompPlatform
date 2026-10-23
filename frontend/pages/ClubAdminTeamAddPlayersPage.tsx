
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getClubPlayers } from "../api/club-admin-players";
import { addTeamPlayers, getClubTeam } from "../api/club-admin-teams";
import { useClubAdminData } from "../api/useApiData";
import { useClubAdminAction } from "../api/useClubAdminAction";
import MatchLoadState from "../components/MatchLoadState";
import TeamPlayerSelection from "../components/club-admin/teams/TeamPlayerSelection";
import { displayId } from "../utils/formatters";

// The backend's reasons a player cannot join a squad (422 PLAYERS_NOT_ELIGIBLE).
const NOT_ELIGIBLE: Record<string, string> = {
  PLAYER_NOT_FOUND: "not found",
  INACTIVE_PLAYER: "inactive player",
  NOT_CLUB_MEMBER: "not a current club member",
  ALREADY_IN_TEAM: "already in this team",
};

export default function ClubAdminTeamAddPlayersPage() {
  const { teamId = "" } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  // The team (for its current squad) and the club's members, who are the only possible players.
  const loadTeam = useCallback(
    (signal: AbortSignal, identity?: string) => getClubTeam(teamId, signal, identity),
    [teamId],
  );
  const teamData = useClubAdminData(loadTeam);
  const playersData = useClubAdminData(getClubPlayers);
  const team = teamData.data;
  const action = useClubAdminAction();

  const existingIds = useMemo(
    () =>
      new Set(
        (team?.players ?? [])
          .filter((item) => item.status === "ACTIVE")
          .map((item) => item.id)
      ),
    [team]
  );

  const members = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (playersData.data ?? [])
      .filter(
        (player) =>
          !query ||
          `${player.firstName} ${player.lastName}`
            .toLowerCase()
            .includes(query) ||
          displayId(player).toLowerCase().includes(query)
      )
      .map((player) => {
        const isMember = player.membership.status === "ACTIVE";
        const alreadyAdded = existingIds.has(player.id);
        const eligible =
          isMember &&
          player.status === "ACTIVE" &&
          !alreadyAdded;

        const reason = alreadyAdded
          ? "Already in this team"
          : !isMember
            ? "Not an active club member"
            : player.status !== "ACTIVE"
              ? "Inactive player"
              : "";

        return { player, eligible, reason };
      })
      .sort(
        (a, b) =>
          Number(b.eligible) - Number(a.eligible) ||
          `${a.player.firstName} ${a.player.lastName}`
            .localeCompare(
              `${b.player.firstName} ${b.player.lastName}`
            )
      );
  }, [search, existingIds, playersData.data]);

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

  function togglePlayer(id: string) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  async function handleAdd() {
    const eligibleIds = new Set(
      members
        .filter((item) => item.eligible)
        .map((item) => item.player.id)
    );

    const validIds = selected.filter((id) =>
      eligibleIds.has(id)
    );

    if (validIds.length === 0) {
      setError("Please select at least one eligible player.");
      return;
    }

    setError("");
    const updated = await action.run(
      (email, signal) => addTeamPlayers(targetTeamId, validIds, email, signal),
      (refusal) => {
        // Nobody is added when anyone cannot be: name each one and why.
        const problems = refusal.body?.players;
        if (refusal.code !== "PLAYERS_NOT_ELIGIBLE" || !Array.isArray(problems)) return null;
        const names = new Map(members.map(({ player }) => [player.id, `${player.firstName} ${player.lastName}`]));
        const listed = problems.map(({ id, reason }: { id: string; reason: string }) =>
          `${names.get(id) ?? id} (${NOT_ELIGIBLE[reason] ?? reason})`);
        return `No players were added. These players can’t join this squad: ${listed.join(", ")}.`;
      },
    );
    if (!updated) return;
    navigate(detailPath, {
      state: { addedPlayers: validIds.length },
    });
  }

  return (
		<TeamPlayerSelection
			teamName={team.name}
			detailPath={detailPath}
			search={search}
			members={members}
			selected={selected}
			error={error || action.error}
			busy={action.busy}
			onSearchChange={setSearch}
			onTogglePlayer={togglePlayer}
			onAdd={handleAdd}
		/>
  );
}
