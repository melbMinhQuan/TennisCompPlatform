type HelpSearchBoxProps = {
  isOpen: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  /** Escape closes the box and clears the keyword. */
  onClose: () => void;
};

export default function HelpSearchBox({ isOpen, search, onSearchChange, onClose }: HelpSearchBoxProps) {
  return (
    <div id="help-search-panel" hidden={!isOpen}>
      {isOpen && (
        <div role="search" aria-label="Help articles and FAQs" className="mt-5 ml-auto max-w-sm">
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
                onClose();
              }
            }}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search help…"
            aria-controls="help-search-results"
            className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-[#1a3049] placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
          />
        </div>
      )}
    </div>
  );
}
