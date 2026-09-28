const LINK_CLASS =
  "rounded text-[#075bc5] underline underline-offset-4 hover:text-[#1a3049] focus-visible:outline-2 focus-visible:outline-[#3f72af] [overflow-wrap:anywhere]";

export type ContactRow = {
  label: string;
  value: string | null;
  /** Makes the value a tap-to-call or tap-to-email link. */
  link?: "phone" | "email";
};

/** "Label: value" lines. Rows without a value are left out. */
export default function ContactDetails({ rows }: { rows: ContactRow[] }) {
  return (
    <dl className="space-y-1">
      {rows
        .filter((row) => row.value)
        .map(({ label, value, link }) => (
          <div key={label} className="min-w-0">
            <dt className="inline font-medium text-[#1a3049]">{label}: </dt>
            <dd className="inline">
              {link ? (
                <a
                  className={LINK_CLASS}
                  href={link === "phone" ? `tel:${value!.replace(/\s+/g, "")}` : `mailto:${value}`}
                >
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
    </dl>
  );
}
