
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getClubPlayers } from "../api/club-admin-players";
import { addTeamPlayers, getClubTeam } from "../api/club-admin-teams";
import { useClubAdminData } from "../api/useApiData";
import { useClubAdminAction } from "../api/useClubAdminAction";
import MatchLoadState from "../components/MatchLoadState";
import {
  matchButtonClass,
  matchCardClass,
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";

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
          player.id.toLowerCase().includes(query)
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
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">
        Teams / {team.name} / Add players
      </p>

      <Link
        to={detailPath}
        className={`${matchLightButtonClass} mt-5`}
      >
        ‹ Back to team
      </Link>

      <h1 className={`mt-6 ${pageTitleClass}`}>
        Add players
      </h1>

      <p className="mt-3 text-sm text-[#d2dfed] md:text-muted">
        Select eligible club members to add to {team.name}.
      </p>

      <div className={`mt-5 text-[#1a3049] ${matchCardClass}`}>
        <label
          htmlFor="team-player-search"
          className="text-sm font-semibold"
        >
          Search players
        </label>

        <input
          id="team-player-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or Player ID"
          className="mt-2 min-h-11 w-full rounded-lg border border-[#c8d8e9] px-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
        />

        <div className="mt-5 flex items-center justify-between border-b border-[#dbe4ef] pb-3">
          <h2 className="font-bold">
            Players ({members.length})
          </h2>
          <span className="text-sm text-muted">
            {selected.length} selected
          </span>
        </div>

        <div className="max-h-[480px] overflow-y-auto">
          {members.length === 0 ? (
            <p className="py-6 text-sm text-muted">
              No players found.
            </p>
          ) : (
            members.map(({ player, eligible, reason }) => (
              <label
                key={player.id}
                className={`flex items-center gap-3 border-b border-[#e4eaf2] py-4 last:border-0 ${
                  eligible ? "cursor-pointer" : "opacity-65"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!eligible}
                  checked={selected.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="h-4 w-4 accent-[#3f72af]"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-xs text-muted">
                    {player.id} · {eligible ? "Active member" : reason}
                  </p>
                </div>

                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    eligible
                      ? "bg-[#e4f5ec] text-[#187650]"
                      : "bg-[#fff1df] text-[#a45a15]"
                  }`}
                >
                  {eligible ? "Eligible" : "Can't add"}
                </span>
              </label>
            ))
          )}
        </div>

        {(error || action.error) && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error || action.error}
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
            disabled={selected.length === 0 || action.busy}
            onClick={() => void handleAdd()}
            className={`${matchButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Add {selected.length}{" "}
            {selected.length === 1 ? "player" : "players"}
          </button>
        </div>
      </div>
    </section>
  );
}
