import type { HELP_FAQS } from "../../data/support-content";

/** A help answer. `steps` (optional) shows as a numbered list under the answer. */
export type HelpFaq = (typeof HELP_FAQS)[number] & { steps?: string[] };

/** One question that opens to show its answer, any numbered steps and any "More information" links. */
export default function FaqItem({ item }: { item: HelpFaq }) {
  const links = "links" in item ? item.links : undefined;
  return (
    <details className="mt-3 rounded-lg border border-slate-200 p-4">
      <summary className="cursor-pointer rounded font-medium text-[#1a3049] focus-visible:outline-2 focus-visible:outline-[#3f72af]">
        {item.title}
      </summary>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.content}</p>
      {item.steps && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600">
          {item.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {links && (
        <div className="mt-3 text-sm">
          <p className="font-medium text-[#1a3049]">More information</p>
          <ul className="mt-2 space-y-2">
            {links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded text-[#075bc5] underline underline-offset-4 hover:text-[#1a3049] focus-visible:outline-2 focus-visible:outline-[#3f72af]"
                >
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <span aria-hidden="true" className="ml-1">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
