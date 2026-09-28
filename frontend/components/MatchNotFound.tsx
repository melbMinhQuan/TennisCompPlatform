import { Link } from "react-router";
import { matchCardClass, matchLightButtonClass } from "./MatchesUI";

export default function MatchNotFound({
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

      <p className="mt-3 text-sm leading-6 text-muted">
        Please return to your matches and select another record.
      </p>

      <Link to={backTo} className={`${matchLightButtonClass} mt-5`}>
        Back to my matches
      </Link>
    </section>
  );
}
