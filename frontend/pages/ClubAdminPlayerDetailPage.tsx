
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  mockPlayers,
  mockClubs,
  mockClubMemberships,
  mockTeams,
  mockTeamPlayers,
} from "../data/clubAdminPlayers";

const CLUB_ID = "CLB01";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#c8d8e9] bg-white px-5 text-sm font-medium text-[#1a3049] hover:bg-[#e6eff9]";

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
  const { playerId } = useParams<{ playerId: string }>();
  const [ended, setEnded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const player = mockPlayers.find((p) => p.id === playerId);

  const memberships = useMemo(
    () =>
      mockClubMemberships.filter(
        (membership) => membership.playerId === playerId
      ),
    [playerId]
  );

  const currentMembership = memberships.find(
    (membership) => membership.clubId === CLUB_ID
  );

  const playerTeams = useMemo(() => {
    const clubTeams = new Map(
      mockTeams
        .filter((team) => team.clubId === CLUB_ID)
        .map((team) => [team.id, team])
    );

    return mockTeamPlayers
      .filter(
        (tp) =>
          tp.playerId === playerId &&
          tp.status === "ACTIVE" &&
          clubTeams.has(tp.teamId)
      )
      .flatMap((tp) => {
        const team = clubTeams.get(tp.teamId);
        return team ? [team] : [];
      });
  }, [playerId]);

  if (!player || !currentMembership) {
    return (
      <section className="text-white md:text-[#1a3049]">
        <h1 className="text-3xl font-bold">Player not found</h1>
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

  const primaryClubName = mockClubs.find(
    (club) => club.id === primaryClub?.clubId
  )?.name;

  const isPrimary = currentMembership.isPrimary;

  return (
    <section className="text-white md:text-[#1a3049]">
      {/* Breadcrumb */}
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-[#60758d]">
        Players / {fullName}
      </p>

      <Link
        to="/club-admin/players"
        className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#e6eff9] px-5 text-sm font-semibold text-[#1a3049]"
      >
        ‹ Players
      </Link>

      <h1 className="mt-6 text-3xl font-bold md:text-4xl">
        {fullName}
      </h1>

      <p className="mt-4 text-sm text-[#d2dfed] md:text-[#60758d]">
        Player ID {player.id} · One record shared by every
        club they play for.
      </p>

      
    {/* Membership Summary */}
    <div className="mt-5 rounded-2xl bg-[#1c334e] p-5 text-white md:p-6">
        <h2 className="text-lg font-bold">
            Glen Waverley membership
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
                {playerTeams.length}
            </p>
            <p className="text-xs text-[#aebed0]">
                Team this season
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
          const club = mockClubs.find(
            (c) => c.id === membership.clubId
          );

          const status =
            ended && membership.clubId === CLUB_ID
              ? "INACTIVE"
              : membership.status;

          return (
            <div
              key={membership.id}
              className="border-b border-[#dbe4ef] py-4 last:border-b-0"
            >
              <p className="font-semibold">
                {club?.name ?? membership.clubId}
              </p>

              <p className="mt-1 text-sm text-[#60758d]">
                {membership.clubId === CLUB_ID
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
            End Glen Waverley membership
          </button>
        )}
      </div>

      {/* Teams */}
      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <h2 className="border-b border-[#dbe4ef] pb-2 text-lg font-bold">
          Teams
        </h2>

        {playerTeams.length === 0 ? (
          <p className="py-4 text-sm text-[#60758d]">
            No team yet.
          </p>
        ) : (
          playerTeams.map((team) => (
            <div
              key={team.id}
              className="border-b border-[#dbe4ef] py-4 last:border-b-0"
            >
              <p className="font-semibold">{team.name}</p>
              <p className="mt-1 text-sm text-[#60758d]">
                Section {team.sectionId}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-[#e4f5ec] px-3 py-1 text-xs font-semibold text-[#187650]">
                  In squad
                </span>

                <Link
                  to="/club-admin/teams"
                  className="text-sm font-semibold text-[#4278b7] hover:underline"
                >
                  View team ›
                </Link>
              </div>
            </div>
          ))
        )}

        <Link
          to="/club-admin/teams"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#e6eff9] px-5 text-sm font-medium text-[#1a3049] md:w-auto"
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

            <p className="mt-3 text-sm text-[#60758d]">
              This will mark the Glen Waverley membership as
              inactive in this page's demo state.
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
                className="min-h-11 rounded-lg bg-[#4278b7] px-5 font-medium text-white"
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
