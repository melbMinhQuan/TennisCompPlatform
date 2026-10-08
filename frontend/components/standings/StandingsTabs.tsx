import { tabClass } from "../MatchesUI";
import type { View } from "./standings-helpers";

const TABS: [View, string][] = [
  ["teams", "Team standings"],
  ["players", "Player standings"],
  ["rankings", "UTR rankings"],
];

export default function StandingsTabs({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <div role="group" aria-label="Standings view" className="flex flex-wrap gap-3">
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => onChange(id)}
          className={`${tabClass(view === id)} min-[768px]:w-44`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
