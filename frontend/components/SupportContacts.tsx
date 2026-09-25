const SUPPORT_CONTACTS = [
  { title: "Team manager / Club administrator", description: "Selection, availability, team membership, profile details, and fixture arrangements.", fallback: "Contact details are not available here yet. Use your existing club or team contact." },
  { title: "Competition organiser / Association", description: "Competition rules, eligibility, unresolved result disputes, and competition administration.", fallback: "Contact details are not available here yet. Ask your club administrator for the appropriate organiser." },
  { title: "Technical support", description: "Login errors, pages failing to load, broken buttons, and unexpected error messages.", fallback: "A verified technical support contact has not been published yet. Ask your club administrator where to report an issue." },
];

export default function SupportContacts() {
  return (
    <aside className="rounded-2xl bg-white p-6" aria-labelledby="contacts-heading">
      <h2 id="contacts-heading" className="text-xl font-semibold text-[#1a3049]">Who should I contact?</h2>
      <div className="mt-5 space-y-4">
        {SUPPORT_CONTACTS.map((contact) => (
          <section key={contact.title} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-[#1a3049]">{contact.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{contact.description}</p>
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{contact.fallback}</p>
          </section>
        ))}
      </div>
    </aside>
  );
}
