import { getPlayerMemberships } from "../api/memberships";
import { useApiData } from "../api/useApiData";
import { pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import AssociationSection from "../components/clubs/AssociationSection";
import ClubCard from "../components/clubs/ClubCard";
import MembershipSummary from "../components/clubs/MembershipSummary";
import {
  CLUB_CARD_CLASS,
  currentFirst,
  primaryFirst,
  type ClubMembership,
} from "../components/clubs/membership-helpers";

export default function MyClubsPage() {
  const { data, error, retry } = useApiData(getPlayerMemberships);
  const associations = data ? [...data.associations].sort(primaryFirst) : [];
  const clubs = data ? [...data.clubs].sort(primaryFirst) : [];
  // Club ownership alone does not establish a player's association membership.
  const ungroupedClubs = clubs.filter((c) => !associations.some((a) => a.associationId === c.associationId));
  const primaryAssociation = associations.find((a) => a.isPrimary);
  const clubCard = (club: ClubMembership) => (
    <ClubCard
      key={data!.player.id + club.id}
      club={club}
      teams={data!.teams.filter((t) => t.clubId === club.clubId).sort(currentFirst)}
    />
  );
  return (
    <div className={`${pageClass} leading-[1.45]`}>
      <header>
        <h1 className={pageTitleClass}>My Clubs &amp; Associations &amp; Teams</h1>
        <p className={pageIntroClass}>Your club and association memberships, and the teams you play in.</p>
      </header>
      {!data ? (
        <MatchLoadState error={error} retry={retry} />
      ) : (
        <>
          <MembershipSummary
            playerName={data.player.displayName}
            primaryAssociationName={primaryAssociation?.name}
            counts={{
              associations: new Set(associations.map((a) => a.associationId)).size,
              clubs: new Set(clubs.map((c) => c.clubId)).size,
              teams: new Set(data.teams.map((t) => t.id)).size,
            }}
          />
          {associations.map((a) => (
            <AssociationSection
              key={a.id}
              association={a}
              clubCards={clubs.filter((c) => c.associationId === a.associationId).map(clubCard)}
            />
          ))}
          {ungroupedClubs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white md:text-[#1a3049]">Other club memberships</h2>
              {ungroupedClubs.map((c) => (
                <div key={c.id}>
                  <p className="mb-2 text-sm text-white md:text-muted">{c.associationName}</p>
                  {clubCard(c)}
                </div>
              ))}
            </section>
          )}
          {!associations.length && !clubs.length && (
            <p className={CLUB_CARD_CLASS}>No association or club memberships recorded yet.</p>
          )}
        </>
      )}
    </div>
  );
}
