import { Link, useParams } from "react-router";
import { competitionMock } from "../data/mock-competitions";

const cardClass =
  "min-w-0 rounded-2xl border border-[#dce4ee] bg-white p-5 min-[768px]:p-6";

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-[#718196]";

const quickLinkClass =
  "flex min-h-11 items-center justify-between gap-3 rounded-lg bg-[#e8f0fa] px-4 py-3 text-sm font-medium text-[#1a3049] transition-colors hover:bg-[#dce8f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

export default function CompetitionDetailsPage() {
  const { entryId } = useParams();

  const competition = competitionMock.find(
    (item) => item.id === entryId,
  );

  if (!competition) {
    return (
      <section className={cardClass}>
        <h1 className="text-2xl font-bold text-[#1a3049]">
          Competition not found
        </h1>

        <p className="mt-3 text-sm text-[#718196]">
          Please return to your competitions and select an entry.
        </p>

        <Link
          to="/dashboard/competitions"
          className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-[#3f72af] underline"
        >
          Back to my competitions
        </Link>
      </section>
    );
  }

  const fixture = competition.nextFixture;

  return (
    <div className="space-y-6 text-[#1a3049]">
      <Link
        to="/dashboard/competitions"
        className="inline-flex min-h-11 items-center rounded-lg bg-[#e8f0fa] px-4 py-3 text-sm font-medium text-[#1a3049]"
      >
        ‹ My competitions
      </Link>

      <header>
        <h1 className="text-[28px] font-bold leading-tight text-white min-[768px]:text-[32px]min-[768px]:text-[#1a3049]">
          {competition.name}
        </h1>

        <p className="mt-5 text-sm leading-6 text-white/85 min-[768px]:text-[#526579]">
          {competition.association} · {competition.season} ·{" "}
          {competition.section}
        </p>
      </header>

      <section className="rounded-2xl bg-white p-4">
        <h2 className="text-sm font-semibold">Quick links</h2>

        <nav
          aria-label="Competition quick links"
          className="mt-3 grid gap-3 min-[768px]:grid-cols-3"
        >
          <Link
            to="/dashboard/matches?view=results"
            className={quickLinkClass}
          >
            My results
            <span aria-hidden="true">›</span>
          </Link>

          <Link
            to="/dashboard/clubs"
            className={quickLinkClass}
          >
            My teams
            <span aria-hidden="true">›</span>
          </Link>

          <Link
            to="/dashboard/rankings"
            className={quickLinkClass}
          >
            Standings
            <span aria-hidden="true">›</span>
          </Link>
        </nav>
      </section>

      <div className="grid items-start gap-5 min-[1100px]:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-lg font-semibold">Your entry</h2>

          <span className="mt-3 inline-flex rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#34806a]">
            REGISTERED
          </span>

          <p className={`${labelClass} mt-4`}>
            Representing
          </p>

          <p className="mt-2 text-base font-semibold">
            {competition.club}
          </p>

          <p className={`${labelClass} mt-5`}>
            Your team
          </p>

          <p className="mt-2 text-base font-semibold">
            {competition.team}
          </p>

          <p className="mt-3 text-sm leading-6 text-[#718196]">
            Player ID {competition.player.id} · {competition.player.name}
          </p>
        </section>

        <section className={cardClass}>
          <h2 className="text-lg font-semibold">
            Competition information
          </h2>

          <dl className="mt-5 space-y-5">
            <div>
              <dt className={labelClass}>Season</dt>
              <dd className="mt-2 text-base font-semibold">
                {competition.season}
              </dd>
            </div>

            <div>
              <dt className={labelClass}>Format</dt>
              <dd className="mt-2 text-base font-semibold">
                {competition.format}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-sm leading-6 text-[#718196]">
            Team fixtures contain individual matches, also called rubbers.
            Your selection for each fixture is confirmed separately.
          </p>
        </section>
      </div>

      {fixture ? (
        <section className={cardClass}>
          <h2 className="text-lg font-semibold">
            Next team fixture · Round {fixture.round}
          </h2>

          <h3 className="mt-5 text-xl font-semibold leading-7">
            {fixture.homeTeam} vs {fixture.awayTeam}
          </h3>

          <p className="mt-3 text-sm leading-6 text-[#718196]">
            {fixture.date} · {fixture.time} · {fixture.side}
          </p>

          <p className="mt-1 text-sm leading-6 text-[#718196]">
            {fixture.venue
              ? fixture.venue
              : "Venue confirmation pending"}
          </p>

          <Link
            to={`/dashboard/matches/${fixture.id}`}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#3f72af] px-6 py-3 text-sm font-medium text-white"
          >
            View fixture details
          </Link>
        </section>
      ) : (
  <section className={cardClass}>
    <h2 className="text-lg font-semibold">
      Next team fixture
    </h2>

    <p className="mt-4 text-sm text-[#718196]">
      No upcoming fixture is currently available for this competition.
    </p>
  </section>
)}
    </div>
  );
}