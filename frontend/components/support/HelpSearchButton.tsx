import type { RefObject } from "react";

type HelpSearchButtonProps = {
  isOpen: boolean;
  onClick: () => void;
  /** Focus returns here when the search box closes. */
  buttonRef: RefObject<HTMLButtonElement | null>;
};

/** Magnifying glass that opens the help search, or a cross that closes it. */
export default function HelpSearchButton({ isOpen, onClick, buttonRef }: HelpSearchButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={isOpen ? "Close help search" : "Open help search"}
      aria-expanded={isOpen}
      aria-controls="help-search-panel"
      onClick={onClick}
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#1a3049] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#3f72af]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="size-6"
      >
        {isOpen ? (
          <path d="m6 6 12 12M18 6 6 18" />
        ) : (
          <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </>
        )}
      </svg>
    </button>
  );
}
