import { Link } from "react-router";
import { matchCardClass } from "../MatchesUI";

const QUICK_LINK_CLASS =
  "flex min-h-11 items-center justify-between gap-3 rounded-lg bg-[#e8f0fa] px-4 py-3 text-sm font-medium text-[#1a3049] transition-colors hover:bg-[#dce8f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

const QUICK_LINKS = [
  { label: "My results", to: "/dashboard/matches?view=results" },
  { label: "My teams", to: "/dashboard/clubs" },
  { label: "Standings", to: "/dashboard/rankings" },
];

export default function CompetitionQuickLinks() {
  return (
    <section className={matchCardClass}>
      <h2 className="text-sm font-semibold">Quick links</h2>
      <nav aria-label="Competition quick links" className="mt-3 grid gap-3 min-[768px]:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className={QUICK_LINK_CLASS}>
            {link.label}
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
