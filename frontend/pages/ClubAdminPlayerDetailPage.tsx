
import { useCallback, useContext, useState } from "react";
import { Link, useParams } from "react-router";
import { getClubPlayer } from "../api/club-admin-players";
import { useClubAdminData } from "../api/useApiData";
import { RoleSessionContext } from "../context/RoleSession";
import MatchLoadState from "../components/MatchLoadState";
import {
  matchLightButtonClass,
  pageTitleClass,
} from "../components/MatchesUI";
import { shortClubName } from "../utils/formatters";

const secondaryButton = matchLightButtonClass;

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;

  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ClubAdminPlayerDetailPage() {
  const { playerId = "" } = useParams<{ playerId: string }>();
  const [ended, setEnded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signedIn } = useContext(RoleSessionContext);
  const clubId = signedIn?.clubId;
  const clubName = shortClubName(signedIn?.clubName ?? "Your club");

  // Every club the player belongs to, and this club's teams only; null when they are not a member.
  const load = useCallback(
    (signal: AbortSignal, identity?: string) => getClubPlayer(playerId, signal, identity),
    [playerId],
  );
  const { data: player, error, retry } = useClubAdminData(load);

  if (player === undefined) return <MatchLoadState error={error} retry={retry} />;

  const memberships = player?.memberships ?? [];
  const currentMembership = memberships.find(
    (membership) => membership.clubId === clubId
  );

  // Teams the player is in the squad of, active or past season.
  const playerTeams = (player?.teams ?? []).filter((team) => team.status === "ACTIVE");

  // Only teams in the season being played now count as "this season".
  const currentTeamCount = playerTeams.filter((team) => team.seasonStatus === "ACTIVE").length;

  if (!player || !currentMembership) {
    return (
      <section className="text-white md:text-[#1a3049]">
        <h1 className={pageTitleClass}>Player not found</h1>
        <p className="mt-3">
          This player is not a member of your club.
        </p>
        <Link
          to="/club-admin/players"
          className="mt-5 inline-block underline"
        >
          Back to players
        </Link>
      </section>
    );
  }

  const fullName = `${player.firstName} ${player.lastName}`;
  const currentStatus = ended
    ? "INACTIVE"
    : currentMembership.status;

  const primaryClub = memberships.find(
    (membership) => membership.isPrimary
  );

  const primaryClubName = primaryClub?.clubName;

  const isPrimary = currentMembership.isPrimary;

  return (
    <section className="text-white md:text-[#1a3049]">
      {/* Breadcrumb */}
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-muted">
        Players / {fullName}
      </p>

      <Link to="/club-admin/players" className={`${secondaryButton} mt-5`}>
        ‹ Players
      </Link>

      <h1 className={`mt-6 ${pageTitleClass}`}>
        {fullName}
      </h1>

      <p className="mt-4 text-sm text-[#d2dfed] md:text-muted">
        Player ID {player.id} · One record shared by every
        club they play for.
      </p>

      
    {/* Membership Summary */}
    <div className="mt-5 rounded-2xl bg-[#1c334e] p-5 text-white md:p-6">
        <h2 className="text-lg font-bold">
            {clubName} membership
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-[100px_190px_130px_1fr] md:gap-x-5">
            {/* Status */}
            <div>
            <p className="text-xl font-bold">
                {currentStatus === "ACTIVE" ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-[#aebed0]">Status</p>
            </div>

            {/* Club type */}
            <div>
            <p className="text-xl font-bold">
                {isPrimary ? "Primary" : "Additional club"}
            </p>
            <p className="text-xs text-[#aebed0]">
                {isPrimary
                ? "Primary club"
                : `Primary club: ${primaryClubName ?? "Unknown"}`}
            </p>
            </div>

            {/* Joined date */}
            <div>
            <p className="text-xl font-bold">
                {formatDate(currentMembership.startDate)}
            </p>
            <p className="text-xs text-[#aebed0]">Joined</p>
            </div>

            {/* Team count */}
            <div>
            <p className="text-xl font-bold">
                {currentTeamCount}
            </p>
            <p className="text-xs text-[#aebed0]">
                {currentTeamCount === 1 ? "Team this season" : "Teams this season"}
            </p>
            </div>
        </div>
    </div>


      {/* Club Membership */}
      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <h2 className="border-b border-[#dbe4ef] pb-2 text-lg font-bold">
          Club membership
        </h2>

        {memberships.map((membership) => {
          const status =
            ended && membership.clubId === clubId
              ? "INACTIVE"
              : membership.status;

          return (
            <div
              key={membership.clubId}
              className="border-b border-[#dbe4ef] py-4 last:border-b-0"
            >
              <p className="font-semibold">
                {membership.clubName}
              </p>

              <p className="mt-1 text-sm text-muted">
                {membership.clubId === clubId
                  ? `Joined ${formatDate(membership.startDate)}`
                  : "Managed by that club"}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    status === "ACTIVE"
                      ? "bg-[#e4f5ec] text-[#187650]"
                      : "bg-[#f0f1f3] text-[#64748b]"
                  }`}
                >
                  {status === "ACTIVE" ? "Active" : "Inactive"}
                </span>

                <span className="rounded-md bg-[#e7f0fa] px-3 py-1 text-xs font-semibold">
                  {membership.isPrimary
                    ? "Primary club"
                    : "Additional club"}
                </span>
              </div>
            </div>
          );
        })}

        {currentStatus === "ACTIVE" && (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className={`${secondaryButton} mt-4 w-full md:w-auto`}
          >
            End {clubName} membership
          </button>
        )}
      </div>

      {/* Teams */}
      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <h2 className="border-b border-[#dbe4ef] pb-2 text-lg font-bold">
          Teams
        </h2>

        {playerTeams.length === 0 ? (
          <p className="py-4 text-sm text-muted">
            No team yet.
          </p>
        ) : (
          playerTeams.map((team) => (
            <div
              key={team.teamId}
              className="border-b border-[#dbe4ef] py-4 last:border-b-0"
            >
              <p className="font-semibold">{team.teamName}</p>
              <p className="mt-1 text-sm text-muted">
                {team.competitionName} · {team.seasonLabel} · {team.sectionName}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {team.seasonStatus === "ACTIVE" || team.seasonStatus === "UPCOMING" ? (
                  <span className="rounded-md bg-[#e4f5ec] px-3 py-1 text-xs font-semibold text-[#187650]">
                    In squad
                  </span>
                ) : (
                  <span className="rounded-md bg-[#f0f1f3] px-3 py-1 text-xs font-semibold text-[#64748b]">
                    Past season
                  </span>
                )}

                <Link
                  to={`/club-admin/teams/${team.teamId}`}
                  className="text-sm font-semibold text-[#3f72af] hover:underline focus-visible:outline-2 focus-visible:outline-[#3f72af]"
                >
                  View team ›
                </Link>
              </div>
            </div>
          ))
        )}

        <Link
          to="/club-admin/teams"
          className={`${secondaryButton} mt-4 w-full md:w-auto`}
        >
          + Add to a team
        </Link>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-membership-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-[#1a3049]"
          >
            <h2
              id="end-membership-title"
              className="text-xl font-bold"
            >
              End membership?
            </h2>

            <p className="mt-3 text-sm text-muted">
              This will mark the {clubName} membership as
              inactive on this page only.
              No database changes will be made.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="min-h-11 rounded-lg bg-red-600 px-5 font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                onClick={() => {
                  setEnded(true);
                  setShowConfirm(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
