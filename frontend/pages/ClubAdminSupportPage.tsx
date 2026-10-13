import { useRef, useState } from "react";
import { CLUB_ADMIN_HELP_FAQS, CLUB_ADMIN_HELP_TOPICS } from "../data/club-admin-support-content";
import { pageClass, pageTitleClass } from "../components/MatchesUI";
import ClubAdminContacts from "../components/support/ClubAdminContacts";
import ClubAdminQuickGuide from "../components/support/ClubAdminQuickGuide";
import FaqResults from "../components/support/FaqResults";
import HelpSearchBox from "../components/support/HelpSearchBox";
import HelpSearchButton from "../components/support/HelpSearchButton";
import HelpTopics from "../components/support/HelpTopics";

/** Club administrator Help & Support: same layout as the player Help page, with club admin answers. */
export default function ClubAdminSupportPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const faqHeadingRef = useRef<HTMLHeadingElement>(null);
  const topicsHeadingRef = useRef<HTMLHeadingElement>(null);
  const getTopicTitle = (id: string) => CLUB_ADMIN_HELP_TOPICS.find((topic) => topic.id === id)?.title;

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
  // Choosing a topic starts a fresh browse; on phones it also scrolls down to the answers.
  const selectTopic = (topic: string) => {
    setSelectedTopic(topic);
    setSearch("");
    if (window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => moveToHeading(faqHeadingRef.current));
    }
  };

  const searchWords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searchResults = CLUB_ADMIN_HELP_FAQS.filter((item) => {
    const steps = "steps" in item ? (item.steps?.join(" ") ?? "") : "";
    const points = "points" in item ? (item.points?.join(" ") ?? "") : "";
    const text = `${getTopicTitle(item.topic) ?? ""} ${item.title} ${item.content} ${steps} ${points}`.toLowerCase();
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
      </header>

      <ClubAdminQuickGuide />

      <HelpTopics
        topics={CLUB_ADMIN_HELP_TOPICS}
        faqs={CLUB_ADMIN_HELP_FAQS}
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
        <ClubAdminContacts />
      </div>
    </div>
  );
}
