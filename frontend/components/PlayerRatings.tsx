import { UTR_RESOURCES } from "../data/support-content";

// Same external guides as the Help & Support UTR answers.
const ratingResources = UTR_RESOURCES.map((resource) => ({ href: resource.url, label: resource.label }));

type PlayerRatingsProps = {
  rating?: number | null;
};

export default function PlayerRatings({
  rating,
}: PlayerRatingsProps) {
  return (
    <section
      className="flex min-w-0 min-h-[360px] flex-col rounded-2xl bg-white p-6"
    >
      {/* Title */}
      <h2 className="text-center text-xl font-semibold text-brand">
        UTR Rating
      </h2>
      <p className="mt-1 text-center text-sm text-muted">Source: Universal Tennis</p>

      {/* UTR data */}
      <div className="mt-6">
        <p className="text-sm text-muted">Current UTR rating</p>
        <p className={typeof rating === "number" ? "mt-1 text-4xl font-semibold text-[#1a3049]" : "mt-1 font-semibold text-[#1a3049]"}>
          {typeof rating === "number" ? rating.toFixed(2) : "Not available"}
        </p>

        <p className="mt-4 text-[#1a3049]">
          Rating supplied by Universal Tennis.
          Waverley Tennis does not calculate UTR.
        </p>
      </div>

      {/* External links */}
      <div className="mt-auto pt-8">
        <h3 className="text-lg font-semibold text-[#1a3049]">More information:</h3>

        <div className="mt-4 flex flex-col items-center gap-3">
          {ratingResources.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] w-full max-w-[280px]
                        items-center justify-center rounded-full
                        border border-black px-5 text-center
                        text-sm font-medium text-[#075bc5]
                        underline underline-offset-2
                        transition hover:bg-slate-50"
              >
                {resource.label}
                <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}