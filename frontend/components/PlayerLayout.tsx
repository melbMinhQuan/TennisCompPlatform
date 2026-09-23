import { NavLink, Outlet, Link, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";
import logo from "../resources/Logo.png";
import PlayerProfileLink from "./PlayerProfileLink";

const menuItems = [
  { label: "Profile", to: "/dashboard", end: true },
  { label: "Competitions", to: "/dashboard/competitions" },
  { label: "Matches", to: "/dashboard/matches" },
  { label: "My Clubs & Association", to: "/dashboard/clubs" },
  { label: "Standings & Rankings", to: "/dashboard/rankings" },
];

// Pass the logged-in player's display name here when the API is connected.
export default function PlayerLayout({ playerDisplayName }: { playerDisplayName?: string | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSupportPage = useLocation().pathname === "/dashboard/support";
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const drawer = drawerRef.current;
    drawer?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      drawer?.close();
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      menuButtonRef.current?.focus();
    };
  }, [isMobileMenuOpen]);
  const closeMobileMenu = () => {
    if (!window.matchMedia("(min-width: 768px)").matches) setIsMenuOpen(false);
  };
  const menuClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex min-h-[48px] items-center justify-center",
      "rounded-[8px] px-3 py-3 text-center text-[14px]",
      "transition-colors",
      "focus-visible:outline-2 focus-visible:outline-offset-2",
      "focus-visible:outline-white",
      isActive ? "bg-[#3f72af] text-white" : "text-white hover:bg-white/10",
    ].join(" ");

  return (
    <div className={`flex min-h-dvh flex-col bg-[#1a3049] ${isSupportPage ? "mobile-support-shell" : ""}`}>
      {/* Top bar */}
      <header
        className="flex h-[72px] shrink-0 items-center gap-2 bg-gradient-to-r from-[#1a3049] to-[#3f72af] px-4 md:h-20 md:justify-between md:gap-4 md:px-5"
      >
        <button ref={menuButtonRef} type="button" aria-expanded={isMobileMenuOpen} aria-controls="mobile-player-menu" onClick={() => setIsMobileMenuOpen(true)} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white md:hidden">
          <span aria-hidden="true">☰</span> Menu
        </button>
        <Link to="/dashboard" aria-label="Waverley Tennis profile" className="min-w-0 flex-1 md:flex-none">
          <img
            src={logo}
            alt="Waverley Tennis"
            className="h-[54px] w-full max-w-[132px] object-contain md:h-[60px] md:w-[170px] md:max-w-none md:object-left"
          />
        </Link>

        <PlayerProfileLink displayName={playerDisplayName} />
      </header>

      <div className="hidden px-3 py-2 md:block">
        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="player-sidebar"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
            <path d={isMenuOpen ? "m6 6 12 12M18 6 6 18" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
          {isMenuOpen ? "Close menu" : "Menu"}
        </button>
      </div>
      <dialog ref={drawerRef} id="mobile-player-menu" aria-label="Player menu" onCancel={(event) => { event.preventDefault(); setIsMobileMenuOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setIsMobileMenuOpen(false); }} className="fixed inset-auto top-[72px] left-0 m-0 h-[calc(100dvh-72px)] max-h-none w-[280px] max-w-[calc(100vw-20px)] border-0 bg-[#1a3049] p-0 text-white backdrop:bg-black/35">
        <div className="flex min-h-full flex-col p-5">
          <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="mb-2.5 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"><span aria-hidden="true">×</span> Close menu</button>
          <p className="mb-2.5 text-xs text-slate-300">PLAYER MENU</p>
          <nav aria-label="Mobile player menu" className="flex flex-col gap-2.5">
            {menuItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={menuClass} onClick={() => setIsMobileMenuOpen(false)}>{item.label}</NavLink>)}
          </nav>
          <div className="mt-auto flex flex-col gap-2.5 pt-12">
            <NavLink to="/dashboard/support" className={menuClass} onClick={() => setIsMobileMenuOpen(false)}>Help &amp; Support</NavLink>
            <Link to="/login" className="flex min-h-12 items-center justify-center rounded-lg text-sm hover:bg-white/10" onClick={() => setIsMobileMenuOpen(false)}>Log out</Link>
          </div>
        </div>
      </dialog>
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left sidebar */}
        <aside id="player-sidebar" hidden={!isMenuOpen} className={isMenuOpen ? "hidden shrink-0 flex-col px-5 pb-5 pt-5 md:flex md:w-[224px]" : "hidden"}>
          <p className="mb-3 text-[12px] text-slate-300">
            PLAYER MENU
          </p>

          <nav aria-label="Player menu" className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={menuClass}
                onClick={closeMobileMenu}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-12">
            <NavLink
              to="/dashboard/support"
              onClick={closeMobileMenu}
              className={menuClass}
            >
              Help &amp; Support
            </NavLink>

            <Link
              to="/login"
              className="
                flex min-h-[48px] items-center justify-center
                rounded-[8px] text-[14px] text-white
                hover:bg-white/10
              "
            >
              Log out
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className={`min-w-0 flex-1 p-5 md:rounded-l-[20px] md:bg-[#e7e7e7] ${isSupportPage ? "bg-transparent" : "bg-[#e7e7e7]"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
