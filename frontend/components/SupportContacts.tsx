import { useContext, useEffect, useState, type ReactNode } from "react";
import { getSupportContacts, type SupportContactsData } from "../api/support-contacts";
import { PlayerSessionContext } from "../context/PlayerSession";

const linkClass = "rounded text-[#315f96] underline underline-offset-4 hover:text-[#1a3049] focus-visible:outline-2 focus-visible:outline-[#3f72af] [overflow-wrap:anywhere]";

function ContactCard({ title, description, children, fallback }: { title: string; description: string; children?: ReactNode; fallback: string }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-[#1a3049] [overflow-wrap:anywhere]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{children ?? fallback}</div>
    </section>
  );
}

function Details({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, value]) => value);
  return <dl className="space-y-1">{shown.map(([label, value]) => <div key={label} className="min-w-0"><dt className="inline font-medium text-[#1a3049]">{label}: </dt><dd className="inline">{value}</dd></div>)}</dl>;
}

const phoneLink = (phone: string | null) => phone && <a className={linkClass} href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>;
const emailLink = (email: string | null) => email && <a className={linkClass} href={`mailto:${email}`}>{email}</a>;

export default function SupportContacts() {
  const { email } = useContext(PlayerSessionContext);
  const [result, setResult] = useState<{ identity: string; data?: SupportContactsData; failed?: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    getSupportContacts(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult({ identity: email, data }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ identity: email, failed: true }); });
    return () => controller.abort();
  }, [email]);
  const current = result?.identity === email ? result : null;
  const data = current?.data;
  const { team, club, association } = data ?? { team: null, club: null, association: null };

  return (
    <aside className="rounded-[32px] bg-white p-6" aria-labelledby="contacts-heading">
      <h2 id="contacts-heading" className="text-xl font-semibold text-[#1a3049]">Who should I contact?</h2>
      {!current && <p role="status" className="mt-3 text-sm text-slate-600">Loading your contacts…</p>}
      {current?.failed && <p role="alert" className="mt-3 text-sm text-slate-600">Your contact details couldn’t be loaded. The general advice below still applies.</p>}
      <div className="mt-5 space-y-4">
        <ContactCard
          title={team ? `Your team · ${team.teamName}` : "Your team manager"}
          description="Team selection, availability, and match-day arrangements."
          fallback="Contact your team manager through your club."
        >
          {team && <>
            <p className="mb-2">{team.competitionName} · {team.seasonLabel}</p>
            <Details rows={[["Team manager", team.managerName], ["Club", team.clubName], ["Phone", phoneLink(team.phone)], ["Email", emailLink(team.email)]]} />
          </>}
        </ContactCard>
        <ContactCard
          title={club ? `Your primary club · ${club.clubName}` : "Your primary club"}
          description="Profile details, login access, and club or team membership. Your primary club looks after your player record."
          fallback="Contact the club administrator at your primary club."
        >
          {club && <Details rows={[["Club administrator", club.adminName], ["Phone", phoneLink(club.phone)], ["Email", emailLink(club.email)], ["Address", club.address]]} />}
        </ContactCard>
        <ContactCard
          title={association ? `Association · ${association.name}` : "Your association"}
          description="Competition rules, eligibility, emergency players, unresolved result disputes, and problems with this website."
          fallback="Ask your club administrator how to contact the association."
        >
          {association && <Details rows={[["Records secretary", association.recordsSecretaryName], ["Phone", phoneLink(association.phone)], ["Email", emailLink(association.email)]]} />}
        </ContactCard>
      </div>
    </aside>
  );
}
