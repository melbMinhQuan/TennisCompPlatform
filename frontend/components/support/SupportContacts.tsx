import { getSupportContacts } from "../../api/support-contacts";
import { useApiData } from "../../api/useApiData";
import ContactCard from "./ContactCard";
import ContactDetails from "./ContactDetails";

/** "Who should I contact?": the player's team, primary club and association contacts. */
export default function SupportContacts() {
  const { data, error, loading, retry } = useApiData(getSupportContacts);
  const { team, club, association } = data ?? { team: null, club: null, association: null };

  return (
    <aside className="rounded-2xl bg-white p-6" aria-labelledby="contacts-heading">
      <h2 id="contacts-heading" className="text-xl font-semibold text-[#1a3049]">
        Who should I contact?
      </h2>
      {loading && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          Loading your contacts…
        </p>
      )}
      {error && (
        <>
          <p role="alert" className="mt-3 text-sm text-slate-600">
            Your contact details couldn’t be loaded. The general advice below still applies.
          </p>
          <button type="button" onClick={retry} className="mt-3 min-h-11 rounded-lg bg-brand px-4 text-white">
            Try again
          </button>
        </>
      )}
      <div className="mt-5 space-y-4">
        <ContactCard
          title={team ? `Your team · ${team.teamName}` : "Your team manager"}
          description="Team selection, availability, and match-day arrangements."
          fallback="Contact your team manager through your club."
        >
          {team && (
            <>
              <p className="mb-2">
                {team.competitionName} · {team.seasonLabel}
              </p>
              <ContactDetails
                rows={[
                  { label: "Team manager", value: team.managerName },
                  { label: "Club", value: team.clubName },
                  { label: "Phone", value: team.phone, link: "phone" },
                  { label: "Email", value: team.email, link: "email" },
                ]}
              />
            </>
          )}
        </ContactCard>
        <ContactCard
          title={club ? `Your primary club · ${club.clubName}` : "Your primary club"}
          description="Profile details, login access, and club or team membership. Your primary club looks after your player record."
          fallback="Contact the club administrator at your primary club."
        >
          {club && (
            <ContactDetails
              rows={[
                { label: "Club administrator", value: club.adminName },
                { label: "Phone", value: club.phone, link: "phone" },
                { label: "Email", value: club.email, link: "email" },
                { label: "Address", value: club.address },
              ]}
            />
          )}
        </ContactCard>
        <ContactCard
          title={association ? `Association · ${association.name}` : "Your association"}
          description="Competition rules, eligibility, emergency players, unresolved result disputes, and problems with this website."
          fallback="Ask your club administrator how to contact the association."
        >
          {association && (
            <ContactDetails
              rows={[
                { label: "Records secretary", value: association.recordsSecretaryName },
                { label: "Phone", value: association.phone, link: "phone" },
                { label: "Email", value: association.email, link: "email" },
              ]}
            />
          )}
        </ContactCard>
      </div>
    </aside>
  );
}
