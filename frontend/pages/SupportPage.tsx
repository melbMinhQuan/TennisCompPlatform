import { useRef, useState } from "react";
import { HELP_FAQS, HELP_TOPICS } from "../data/support-content";
import SupportContacts from "../components/SupportContacts";

export default function SupportPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const faqHeadingRef = useRef<HTMLHeadingElement>(null);
  const topicsHeadingRef = useRef<HTMLHeadingElement>(null);
  const selectedTopicTitle = HELP_TOPICS.find((topic) => topic.id === selectedTopic)?.title;
  const moveToHeading = (heading: HTMLHeadingElement | null) => {
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  // Closing the search box also clears its keyword, so no hidden filter keeps hiding answers.
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearch("");
    searchToggleRef.current?.focus();
  };
  // Choosing a topic always starts a fresh browse, so an old keyword can't hide its answers.
  // Only the scroll is mobile-specific, because the answers sit below the topic grid there.
  const selectTopic = (topic: string) => {
    setSelectedTopic(topic);
    setSearch("");
    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => moveToHeading(faqHeadingRef.current));
    }
  };
  const faqCount = (topic: string) => HELP_FAQS.filter((faq) => faq.topic === topic).length;
  const searchWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searchResults = HELP_FAQS.filter((item) => {
    const topicTitle = HELP_TOPICS.find((topic) => topic.id === item.topic)?.title ?? "";
    const text = `${topicTitle} ${item.title} ${item.content}`.toLowerCase();
    return (selectedTopic === "all" || item.topic === selectedTopic)
      && searchWords.every((word) => text.includes(word));
  });

  return (
    <div className="support-page min-w-0 space-y-5">
    <section className="rounded-[32px] bg-white p-6" aria-labelledby="support-heading">
      <div className="flex items-center justify-between gap-3">
        <h1 id="support-heading" className="text-2xl font-semibold text-[#1a3049]">
          Help &amp; Support
        </h1>
        <button
          ref={searchToggleRef}
          type="button"
          aria-label={isSearchOpen ? "Close help search" : "Open help search"}
          aria-expanded={isSearchOpen}
          aria-controls="help-search-panel"
          onClick={() => (isSearchOpen ? closeSearch() : setIsSearchOpen(true))}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#1a3049] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#3f72af]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-6">
            {isSearchOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>}
          </svg>
        </button>
      </div>
      <p className="mt-3 text-slate-600">
        Find answers about your profile, team fixtures, match results, and how to use your Waverley Tennis account.
      </p>

      <div id="help-search-panel" hidden={!isSearchOpen}>
      {isSearchOpen && <div role="search" aria-label="Help articles and FAQs" className="mt-5 ml-auto max-w-sm">
        <label htmlFor="help-search" className="sr-only">
          Search for help
        </label>
        <input
          id="help-search"
          type="search"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeSearch();
            }
          }}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search help…"
          aria-controls="help-search-results"
          className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-[#1a3049] placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
        />
      </div>}
      </div>

      <section className="mt-8" aria-labelledby="help-topics-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 ref={topicsHeadingRef} tabIndex={-1} id="help-topics-heading" className="scroll-mt-5 text-xl font-semibold text-[#1a3049]">Browse help topics</h2>
          <button type="button" aria-pressed={selectedTopic === "all"} onClick={() => selectTopic("all")} className="min-h-11 rounded-lg px-3 text-sm font-medium text-[#1a3049] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#3f72af]">All topics</button>
        </div>
        <p className="mt-1 text-[13px] text-[#596b80] md:hidden">Choose a topic to jump to its answers.</p>
        <div className="help-topic-grid mt-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
          {HELP_TOPICS.map((topic) => (
            <button key={topic.id} type="button" aria-pressed={selectedTopic === topic.id} aria-controls="help-search-results" onClick={() => selectTopic(topic.id)} className={`help-topic-button rounded-xl border-2 p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af] ${selectedTopic === topic.id ? "border-[#3f72af] bg-[#edf4fc]" : "border-slate-200 bg-white hover:border-[#3f72af] hover:bg-slate-50"}`}>
              <span className="block font-semibold text-[#1a3049]">{topic.title}</span>
              <span className="mt-2 hidden text-sm leading-6 text-slate-600 md:block">{topic.description}</span>
              <span className="help-topic-count mt-auto flex items-center justify-between pt-3 text-xs md:hidden">
                <span>{faqCount(topic.id)} {faqCount(topic.id) === 1 ? "FAQ" : "FAQs"}</span>
                <span aria-hidden="true">{selectedTopic === topic.id ? "✓" : "→"}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section id="help-search-results" className="rounded-[32px] bg-white p-6" aria-labelledby="faq-heading">
        {selectedTopicTitle && <p className="mb-2 text-xs font-medium tracking-wide text-[#3f72af]">Frequently asked questions</p>}
        <h2 ref={faqHeadingRef} tabIndex={-1} id="faq-heading" className="scroll-mt-5 text-xl font-semibold text-[#1a3049]">{selectedTopicTitle ?? "Frequently asked questions"}</h2>
        <button type="button" onClick={() => moveToHeading(topicsHeadingRef.current)} className="mt-2 min-h-11 rounded-lg text-sm text-[#1a3049] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#3f72af] md:hidden">← Choose another topic</button>
        <p role="status" className="mt-2 text-sm text-slate-600">
          {searchResults.length === 0
            ? "No answers found. Try another keyword, or see “Who should I contact?”."
            : `${searchResults.length} ${searchResults.length === 1 ? "answer" : "answers"} found${selectedTopic === "all" ? "" : ` in ${HELP_TOPICS.find((topic) => topic.id === selectedTopic)?.title}`}.`}
        </p>
        {searchResults.map((item) => (
          <details key={item.id} className="mt-3 rounded-lg border border-slate-200 p-4">
            <summary className="cursor-pointer rounded font-medium text-[#1a3049] focus-visible:outline-2 focus-visible:outline-[#3f72af]">{item.title}</summary>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.content}</p>
            {item.links && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-[#1a3049]">More information</p>
                <ul className="mt-2 space-y-2">
                  {item.links.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="rounded text-[#315f96] underline underline-offset-4 hover:text-[#1a3049] focus-visible:outline-2 focus-visible:outline-[#3f72af]">
                        {link.label}<span className="sr-only"> (opens in a new tab)</span>
                        <span aria-hidden="true" className="ml-1">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </details>
        ))}
        {(search.trim() || selectedTopic !== "all") && <button type="button" onClick={() => { setSearch(""); setSelectedTopic("all"); }} className="mt-4 min-h-11 rounded-lg px-3 text-sm font-medium text-[#1a3049] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#3f72af]">Clear search and filters</button>}
      </section>
      <SupportContacts />
    </div>
  </div>
  );
}
