import { UTR_RESOURCES } from "../../data/support-content";
import { STANDINGS_CARD_CLASS } from "./standings-helpers";

/** Links for players to check their official UTR with Universal Tennis. */
export default function UtrGuides() {
  return (
    <section className={STANDINGS_CARD_CLASS} aria-labelledby="utr-more-heading">
      <h2 id="utr-more-heading" className="text-xl font-bold">
        More information about your UTR
      </h2>
      <p className="mt-2 text-sm text-muted">
        Your UTR is calculated by Universal Tennis, not Waverley Tennis. To see your latest rating, your rating history,
        or how your match results reach UTR, use these guides.
      </p>
      <ul className="mt-4 flex flex-col gap-3 sm:flex-row">
        {UTR_RESOURCES.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center rounded-full border border-[#c6d3e3] px-5 text-sm font-medium text-[#075bc5] hover:bg-[#f0f5fc] focus-visible:outline-2 focus-visible:outline-[#3f72af]"
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
    </section>
  );
}
