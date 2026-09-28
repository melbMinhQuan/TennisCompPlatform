import { PlayerSessionContext } from "../context/PlayerSession";
import { Outlet, useLocation } from "react-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import MobileMenu from "./layout/MobileMenu";
import PlayerNavigation from "./layout/PlayerNavigation";
import TopBar from "./layout/TopBar";

/** Shell for every /dashboard page: top bar, sidebar (desktop) or drawer (mobile), and the page content. */
export default function PlayerLayout() {
  const { data, email, setEmail: setPlayerEmail } = useContext(PlayerSessionContext);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Stable so the drawer's open/close effect doesn't re-run on every render.
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const logOut = () => setPlayerEmail("");

  const path = useLocation().pathname;
  const playerDisplayName = data?.profile.displayName ?? (!email ? "Chloe Cooper" : undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  }, [path]);

  return (
    <div className="player-shell flex min-h-dvh flex-col bg-[#1a3049]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>

      <TopBar
        isMenuOpen={isMobileMenuOpen}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        menuButtonRef={menuButtonRef}
        playerDisplayName={playerDisplayName}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        onLogout={logOut}
        returnFocusRef={menuButtonRef}
      />

      <div className="flex flex-1 flex-col min-[768px]:flex-row">
        {/* Left sidebar */}
        <aside id="player-sidebar" className="hidden w-[224px] shrink-0 flex-col px-5 pb-5 pt-5 min-[768px]:flex">
          <p className="mb-3 text-[12px] text-slate-300">PLAYER MENU</p>
          <PlayerNavigation onLogout={logOut} />
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-5 outline-none md:rounded-l-[20px] md:bg-[#eef1f4] md:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
