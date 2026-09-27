import { useRef, useState } from "react";
import { HELP_FAQS, HELP_TOPICS } from "../data/support-content";
import { pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";
import FaqResults from "../components/support/FaqResults";
import HelpSearchBox from "../components/support/HelpSearchBox";
import HelpSearchButton from "../components/support/HelpSearchButton";
import HelpTopics from "../components/support/HelpTopics";
import SupportContacts from "../components/support/SupportContacts";

export default function SupportPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const faqHeadingRef = useRef<HTMLHeadingElement>(null);
  const topicsHeadingRef = useRef<HTMLHeadingElement>(null);
  const getTopicTitle = (id: string) => HELP_TOPICS.find((topic) => topic.id === id)?.title;

  const moveToHeading = (heading: HTMLHeadingElement | null) => {
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
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

  const searchWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searchResults = HELP_FAQS.filter((item) => {
    const text = `${getTopicTitle(item.topic) ?? ""} ${item.title} ${item.content}`.toLowerCase();
    return (
      (selectedTopic === "all" || item.topic === selectedTopic) && searchWords.every((word) => text.includes(word))
    );
  });

  return (
    <div className={`support-page ${pageClass}`}>
      <header>
        <h1 id="support-heading" className={pageTitleClass}>
          Help &amp; Support
        </h1>
        <p className={pageIntroClass}>
          Find answers about your profile, team fixtures, match results, and how to use your Waverley Tennis account.
        </p>
      </header>

      <HelpTopics
        selectedTopic={selectedTopic}
        onSelectTopic={selectTopic}
        headingRef={topicsHeadingRef}
        searchButton={
          <HelpSearchButton
            isOpen={isSearchOpen}
            onClick={() => (isSearchOpen ? closeSearch() : setIsSearchOpen(true))}
            buttonRef={searchToggleRef}
          />
        }
        searchBox={<HelpSearchBox isOpen={isSearchOpen} search={search} onSearchChange={setSearch} onClose={closeSearch} />}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FaqResults
          results={searchResults}
          topicTitle={getTopicTitle(selectedTopic)}
          headingRef={faqHeadingRef}
          onChooseAnotherTopic={() => moveToHeading(topicsHeadingRef.current)}
          canClear={Boolean(search.trim()) || selectedTopic !== "all"}
          onClear={() => {
            setSearch("");
            setSelectedTopic("all");
          }}
        />
        <SupportContacts />
      </div>
    </div>
  );
}
