import type { RefObject } from "react";
import FaqItem, { type HelpFaq } from "./FaqItem";

type FaqResultsProps = {
  results: HelpFaq[];
  /** Title of the selected topic, or undefined for all topics. */
  topicTitle?: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  /** Mobile only: scrolls back up to the topic grid. */
  onChooseAnotherTopic: () => void;
  canClear: boolean;
  onClear: () => void;
};

/** FAQ card: how many answers were found, the answers, and "Clear search and filters". */
export default function FaqResults({ results, topicTitle, headingRef, onChooseAnotherTopic, canClear, onClear }: FaqResultsProps) {
  const count = results.length;
  return (
    <section id="help-search-results" className="rounded-2xl bg-white p-6" aria-labelledby="faq-heading">
      {topicTitle && <p className="mb-2 text-xs font-medium tracking-wide text-[#3f72af]">Frequently asked questions</p>}
      <h2 ref={headingRef} tabIndex={-1} id="faq-heading" className="scroll-mt-5 text-xl font-semibold text-[#1a3049]">
        {topicTitle ?? "Frequently asked questions"}
      </h2>
      <button
        type="button"
        onClick={onChooseAnotherTopic}
        className="mt-2 min-h-11 rounded-lg text-sm text-[#1a3049] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#3f72af] md:hidden"
      >
        ← Choose another topic
      </button>
      <p role="status" className="mt-2 text-sm text-slate-600">
        {count === 0
          ? "No answers found. Try another keyword, or see “Who should I contact?”."
          : `${count} ${count === 1 ? "answer" : "answers"} found${topicTitle ? ` in ${topicTitle}` : ""}.`}
      </p>
      {results.map((item) => (
        <FaqItem key={item.id} item={item} />
      ))}
      {canClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 min-h-11 rounded-lg px-3 text-sm font-medium text-[#1a3049] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#3f72af]"
        >
          Clear search and filters
        </button>
      )}
    </section>
  );
}
