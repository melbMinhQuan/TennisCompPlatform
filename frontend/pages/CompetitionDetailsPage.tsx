import { Link, useParams } from "react-router";
import { getCompetitions } from "../api/matches";
import { useApiData } from "../api/useApiData";
import { matchCardClass, matchLightButtonClass, pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import CompetitionEntryCard from "../components/competitions/CompetitionEntryCard";
import CompetitionInfoCard from "../components/competitions/CompetitionInfoCard";
import CompetitionQuickLinks from "../components/competitions/CompetitionQuickLinks";
import NextFixtureCard from "../components/competitions/NextFixtureCard";

export default function CompetitionDetailsPage() {
  const { entryId } = useParams();
  const { data: competitions, error, retry } = useApiData(getCompetitions);
  if (!competitions) return <MatchLoadState error={error} retry={retry} />;

  const competition = competitions.find((item) => item.id === entryId);

  if (!competition) {
    return (
      <section className={matchCardClass}>
        <h1 className="text-2xl font-bold text-[#1a3049]">Competition not found</h1>
        <p className="mt-3 text-sm text-muted">Please return to your competitions and select an entry.</p>
        <Link to="/dashboard/competitions" className={`${matchLightButtonClass} mt-5`}>
          Back to my competitions
        </Link>
      </section>
    );
  }

  return (
    <div className={pageClass}>
      <Link to="/dashboard/competitions" className={matchLightButtonClass}>
        ‹ My competitions
      </Link>

      <header>
        <h1 className={pageTitleClass}>{competition.name}</h1>
        <p className={pageIntroClass}>
          {competition.association} · {competition.season} · {competition.section}
        </p>
      </header>

      <CompetitionQuickLinks />

      <div className="grid items-start gap-5 min-[1100px]:grid-cols-2">
        <CompetitionEntryCard competition={competition} />
        <CompetitionInfoCard competition={competition} />
      </div>

      <NextFixtureCard fixture={competition.nextFixture} />
    </div>
  );
}
