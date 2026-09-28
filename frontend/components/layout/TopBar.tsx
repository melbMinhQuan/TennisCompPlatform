import type { RefObject } from "react";
import { Link } from "react-router";
import logo from "../../resources/Logo.png";
import PlayerProfileLink from "../PlayerProfileLink";

type TopBarProps = {
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  /** Focus returns to the Menu button when the mobile drawer closes. */
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  playerDisplayName?: string;
};

/** Blue header: Menu button (mobile), logo, and profile avatar (desktop). */
export default function TopBar({ isMenuOpen, onOpenMenu, menuButtonRef, playerDisplayName }: TopBarProps) {
  return (
    <header className="relative flex h-[72px] shrink-0 items-center bg-gradient-to-r from-[#1a3049] to-[#3f72af] px-4 min-[768px]:h-20 min-[768px]:justify-between min-[768px]:px-5">
      <button
        ref={menuButtonRef}
        type="button"
        aria-label="Open player menu"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-player-menu"
        onClick={onOpenMenu}
        className="relative z-10 flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white min-[768px]:hidden"
      >
        <span aria-hidden="true">☰</span>
        <span>Menu</span>
      </button>

      {/* Centred on mobile, left-aligned on desktop */}
      <Link
        to="/dashboard"
        aria-label="Waverley Tennis profile"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-[768px]:static min-[768px]:translate-x-0 min-[768px]:translate-y-0"
      >
        <img
          src={logo}
          alt="Waverley Tennis"
          className="h-[54px] w-[132px] object-contain min-[768px]:h-[60px] min-[768px]:w-[170px] min-[768px]:object-left"
        />
      </Link>

      <div className="hidden min-[768px]:block">
        <PlayerProfileLink displayName={playerDisplayName} />
      </div>
    </header>
  );
}
