import { matchButtonClass, matchCardClass } from "./MatchesUI";

/** Loading or error card shown while an API adapter is working. */
export default function MatchLoadState({ error, retry }: { error?: string; retry: () => void }) {
  return error ? (
    <section className={matchCardClass}>
      <p role="alert" className="text-sm text-[#1a3049]">{error}</p>
      <button type="button" onClick={retry} className={`${matchButtonClass} mt-4`}>Try again</button>
    </section>
  ) : (
    <p role="status" className={`${matchCardClass} text-sm text-muted`}>Loading…</p>
  );
}
