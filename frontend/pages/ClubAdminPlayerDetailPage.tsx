
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
import { displayId, shortClubName } from "../utils/formatters";
import GuardianContact from "../components/junior/GuardianContact";
import JuniorBadge from "../components/junior/JuniorBadge";
import JuniorNotice from "../components/junior/JuniorNotice";

import PlayerMembershipDetails from "../components/club-admin/players/PlayerMembershipDetails";

import PlayerTeamsCard from "../components/club-admin/players/PlayerTeamsCard";

import EndMembershipDialog from "../components/club-admin/players/EndMembershipDialog";

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
	const membershipRows = memberships.map((membership) => ({
		clubId: membership.clubId,
		clubName: membership.clubName,
		status: ended && membership.clubId === clubId ? "INACTIVE" as const : membership.status,
		isPrimary: membership.isPrimary,
		joinedLabel: membership.clubId === clubId
			? `Joined ${formatDate(membership.startDate)}`
			: "Managed by that club",
	}));

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
        {player.isJunior && <JuniorBadge />}
      </h1>

      <p className="mt-4 text-sm text-[#d2dfed] md:text-muted">
        Player ID {displayId(player)} · One record shared by every
        club they play for.
      </p>

      {player.isJunior && <JuniorNotice audience="club" className="mt-4" />}

      {/* Personal details: only this club's administrator gets this page (docs/junior-privacy.md). */}
      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <h2 className="border-b border-[#dbe4ef] pb-2 text-lg font-bold">
          Personal details
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          {[
            ["Date of birth", formatDate(player.dateOfBirth)],
            ["Email", player.email ?? "Not supplied"],
            ["Phone", player.phone ?? "Not supplied"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 font-semibold [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
        {player.isJunior && <GuardianContact guardian={player.guardian} className="mt-4 border-t border-[#dbe4ef] pt-4" />}
      </div>

      
    {/* Membership Summary */}
			<PlayerMembershipDetails
				clubName={clubName}
				currentStatus={currentStatus}
				isPrimary={isPrimary}
				primaryClubName={primaryClubName}
				joinedDate={formatDate(currentMembership.startDate)}
				currentTeamCount={currentTeamCount}
				memberships={membershipRows}
				onEndMembership={() => setShowConfirm(true)}
			/>

      {/* Teams */}
			<PlayerTeamsCard teams={playerTeams} />

      {/* Confirmation Dialog */}
      {showConfirm && (
				<EndMembershipDialog
					clubName={clubName}
					onCancel={() => setShowConfirm(false)}
					onConfirm={() => {
						setEnded(true);
						setShowConfirm(false);
					}}
				/>
      )}
    </section>
  );
}
