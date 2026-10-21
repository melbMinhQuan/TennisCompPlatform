/** A junior's parent or guardian, as the API sends it. */
export type Guardian = { name: string | null; email: string | null; phone: string | null };

/** The parent or guardian's name, phone and email, each a link where it can be one. */
export default function GuardianContact({ guardian, className = "" }: { guardian: Guardian | null; className?: string }) {
  if (!guardian) return <p className={`text-sm text-muted ${className}`}>No parent or guardian contact recorded.</p>;
  return (
    <p className={`text-sm leading-6 [overflow-wrap:anywhere] ${className}`}>
      <span className="font-medium">Parent or guardian: {guardian.name ?? "Name not recorded"}</span>
      {guardian.phone && (
        <>
          {" · "}
          <a className="underline" href={`tel:${guardian.phone.replace(/\s+/g, "")}`}>{guardian.phone}</a>
        </>
      )}
      {guardian.email && (
        <>
          {" · "}
          <a className="underline" href={`mailto:${guardian.email}`}>{guardian.email}</a>
        </>
      )}
    </p>
  );
}
