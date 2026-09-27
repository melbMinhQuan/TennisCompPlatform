import { Link } from "react-router";

export const matchCardClass =
  "min-w-0 rounded-2xl border border-[#dce4ee] bg-white p-5 min-[768px]:p-6";

export const matchButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#3f72af] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#315e94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

export const matchLightButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#e8f0fa] px-5 py-3 text-sm font-medium text-[#1a3049] transition-colors hover:bg-[#dce8f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

export const matchLabelClass =
  "text-xs font-medium uppercase tracking-wide text-[#718196]";

export const matchBadgeClass =
  "inline-flex rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#34806a]";

export function MatchNotFound({
  title,
  backTo,
}: {
  title: string;
  backTo: string;
}) {
  return (
    <section className={matchCardClass}>
      <h1 className="text-2xl font-bold text-[#1a3049]">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#718196]">
        Please return to your matches and select another record.
      </p>

      <Link to={backTo} className={`${matchLightButtonClass} mt-5`}>
        Back to my matches
      </Link>
    </section>
  );
}