const ratingResources = [
  {
    href: "https://www.waverleytennis.asn.au/utr.html",
    label: "Waverley Tennis UTR FAQ",
  },
  {
    href: "https://trols.org.au/trols_utr_faq.html",
    label: "TROLS/UTR FAQs",
  },
];

type PlayerRatingsProps = {
  rating?: number | null;
};

export default function PlayerRatings({
  rating,
}: PlayerRatingsProps) {
  return (
    <section
      className="flex min-w-0 min-h-[360px] flex-col rounded-[32px] bg-white p-6"
    >
      {/* Title */}
      <h2 className="text-center text-xl font-semibold text-blue-700">
        Player Ratings by UTR Sports
      </h2>

      {/* UTR data */}
      <div className="mt-6">
        <p className="font-semibold text-black">
          Current UTR: {rating ?? "Not available"}
        </p>

        <p className="mt-6 text-black">
          Rating supplied by Universal Tennis.
          Waverley Tennis does not calculate UTR.
        </p>
      </div>

      {/* External links */}
      <div className="mt-auto pt-8">
        <h3 className="text-lg font-semibold text-black">More information:</h3>

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
                        text-sm font-medium text-purple-800
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