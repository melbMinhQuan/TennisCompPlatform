import type { ReactNode, RefObject } from "react";
import { HELP_FAQS, HELP_TOPICS } from "../../data/support-content";

type HelpTopicsProps = {
  selectedTopic: string;
  onSelectTopic: (topicId: string) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  /** The search button, shown next to "All topics". */
  searchButton: ReactNode;
  /** The search box, shown under the heading when open. */
  searchBox: ReactNode;
};

const faqCount = (topicId: string) => HELP_FAQS.filter((faq) => faq.topic === topicId).length;

/** "Browse help topics" card: topic buttons plus the search controls. */
export default function HelpTopics({ selectedTopic, onSelectTopic, headingRef, searchButton, searchBox }: HelpTopicsProps) {
  return (
    <section className="rounded-2xl bg-white p-6" aria-labelledby="help-topics-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          ref={headingRef}
          tabIndex={-1}
          id="help-topics-heading"
          className="scroll-mt-5 text-xl font-semibold text-[#1a3049]"
        >
          Browse help topics
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={selectedTopic === "all"}
            onClick={() => onSelectTopic("all")}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-[#1a3049] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#3f72af]"
          >
            All topics
          </button>
          {searchButton}
        </div>
      </div>
      {searchBox}
      <p className="mt-1 text-[13px] text-muted md:hidden">Choose a topic to jump to its answers.</p>
      <div className="help-topic-grid mt-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
        {HELP_TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            aria-pressed={selectedTopic === topic.id}
            aria-controls="help-search-results"
            onClick={() => onSelectTopic(topic.id)}
            className={`help-topic-button rounded-xl border-2 p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af] ${selectedTopic === topic.id ? "border-[#3f72af] bg-[#edf4fc]" : "border-slate-200 bg-white hover:border-[#3f72af] hover:bg-slate-50"}`}
          >
            <span className="block font-semibold text-[#1a3049]">{topic.title}</span>
            <span className="mt-2 hidden text-sm leading-6 text-slate-600 md:block">{topic.description}</span>
            <span className="help-topic-count mt-auto flex items-center justify-between pt-3 text-xs md:hidden">
              <span>
                {faqCount(topic.id)} {faqCount(topic.id) === 1 ? "FAQ" : "FAQs"}
              </span>
              <span aria-hidden="true">{selectedTopic === topic.id ? "✓" : "→"}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
