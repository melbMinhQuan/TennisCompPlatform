import { getClubAdminSupportContacts } from "../../api/club-admin-support";
import { useApiData } from "../../api/useApiData";
import ContactCard from "./ContactCard";
import ContactDetails from "./ContactDetails";

/** "Who should I contact?" for club administrators: the association, team managers and their own club. */
export default function ClubAdminContacts() {
  const { data, error, loading, retry } = useApiData(getClubAdminSupportContacts);
  const { club, association } = data ?? { club: null, association: null };

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
          title={association ? `Association · ${association.name}` : "Your association"}
          description="Your administrator access, possible duplicate players, primary club changes, competition rules, confirmed score corrections, disputes and problems with this website."
          fallback="Use your association’s official contact channel."
        >
          {association && (
            <ContactDetails
              rows={[
                { label: "Association administrator", value: association.administratorName },
                { label: "Records secretary", value: association.recordsSecretaryName },
                { label: "Phone", value: association.phone, link: "phone" },
                { label: "Email", value: association.email, link: "email" },
              ]}
            />
          )}
        </ContactCard>
        <ContactCard
          title="Team managers"
          description="Fixture selection, availability, match day arrangements and entering or confirming results for their team."
          fallback="Each team’s manager is shown on its Team details page."
        />
        <ContactCard
          title={club ? `Your club · ${club.clubName}` : "Your club"}
          description="The contact details your players see on their Help page. Ask the association if they are wrong."
          fallback="Your club’s contact details are not recorded yet."
        >
          {club && (
            <ContactDetails
              rows={[
                { label: "Phone", value: club.phone, link: "phone" },
                { label: "Email", value: club.email, link: "email" },
                { label: "Address", value: club.address },
              ]}
            />
          )}
        </ContactCard>
      </div>
    </aside>
  );
}
