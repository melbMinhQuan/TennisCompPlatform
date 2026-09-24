import { PlayerSessionContext } from "../context/PlayerSession";
import { NavLink, Outlet, Link, useLocation } from "react-router";
import { useContext, useEffect, useRef, useState } from "react";
import logo from "../resources/Logo.png";
import PlayerProfileLink from "./PlayerProfileLink";

const menuItems = [
  { label: "Profile", to: "/dashboard", end: true },
  { label: "Competitions", to: "/dashboard/competitions" },
  { label: "Matches", to: "/dashboard/matches" },
  { label: "My Clubs & Associations & Teams", to: "/dashboard/clubs" },
  { label: "Standings & Rankings", to: "/dashboard/rankings" },
];

export default function PlayerLayout() {
  const { data, setEmail: setPlayerEmail } = useContext(PlayerSessionContext);
  const playerDisplayName = data?.profile.displayName;

  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const path = useLocation().pathname;
  const isSupportPage = path === "/dashboard/support" || path === "/dashboard/clubs";
  const isProfilePage = path === "/dashboard";

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const drawer = drawerRef.current;
    drawer?.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMobileMenuOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      drawer?.close();
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      menuButtonRef.current?.focus();
    };
  }, [isMobileMenuOpen]);

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
        className="relative flex h-[72px] shrink-0 items-center
          bg-gradient-to-r from-[#1a3049] to-[#3f72af] px-4
          min-[768px]:h-20 min-[768px]:justify-between
          min-[768px]:px-5"
      >
        {/* Mobile menu */}
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open player menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-player-menu"
          onClick={() => setIsMobileMenuOpen(true)}
          className="relative z-10 flex h-11 shrink-0 items-center
                    justify-center gap-2 rounded-lg px-2 text-sm text-white
                    hover:bg-white/10 focus-visible:outline-2
                    focus-visible:outline-white min-[768px]:hidden"
        >
          <span aria-hidden="true">☰</span>
          <span>Menu</span>
        </button>

        {/* Centered on mobile, left-aligned on desktop */}
        <Link
          to="/dashboard"
          aria-label="Waverley Tennis profile"
          className="absolute left-1/2 top-1/2
                    -translate-x-1/2 -translate-y-1/2
                    min-[768px]:static min-[768px]:translate-x-0
                    min-[768px]:translate-y-0"
        >
          <img
            src={logo}
            alt="Waverley Tennis"
            className="h-[54px] w-[132px] object-contain
                      min-[768px]:h-[60px] min-[768px]:w-[170px]
                      min-[768px]:object-left"
          />
        </Link>

        {/* Desktop profile avatar */}
        <div className="hidden min-[768px]:block">
          <PlayerProfileLink displayName={playerDisplayName} />
        </div>
      </header>

      <dialog ref={drawerRef} id="mobile-player-menu" aria-label="Player menu" onCancel={(event) => { event.preventDefault(); setIsMobileMenuOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setIsMobileMenuOpen(false); }} className="fixed inset-auto top-[72px] left-0 m-0 h-[calc(100dvh-72px)] max-h-none w-[280px] max-w-[calc(100vw-20px)] border-0 bg-[#1a3049] p-0 text-white backdrop:bg-black/35">
        <div className="flex min-h-full flex-col p-5">
          <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="mb-2.5 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"><span aria-hidden="true">×</span> Close menu</button>
          <p className="mb-2.5 text-xs text-slate-300">PLAYER MENU</p>
          <nav aria-label="Mobile player menu" className="flex flex-col gap-2.5">
            {menuItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={menuClass} onClick={() => setIsMobileMenuOpen(false)}>{item.label}</NavLink>)}
          </nav>
          <div className="mt-auto flex flex-col gap-2.5 pt-12">
            <NavLink to="/dashboard/support" className={menuClass} onClick={() => setIsMobileMenuOpen(false)}>Help &amp; Support</NavLink>
            <Link to="/login" onClickCapture={() => setPlayerEmail("")} className="flex min-h-12 items-center justify-center rounded-lg text-sm hover:bg-white/10" onClick={() => setIsMobileMenuOpen(false)}>Log out</Link>
          </div>
        </div>
      </dialog>
      <div className="flex flex-1 flex-col min-[768px]:flex-row">
        {/* Left sidebar */}
        <aside
          id="player-sidebar"
          className="hidden w-[224px] shrink-0 flex-col px-5 pb-5 pt-5 min-[768px]:flex"
        >
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
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-12">
            <NavLink
              to="/dashboard/support"
              className={menuClass}
            >
              Help &amp; Support
            </NavLink>

            <Link
              to="/login" onClickCapture={() => setPlayerEmail("")}
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
        <main
          className={`min-w-0 flex-1 p-5 min-[768px]:rounded-l-[20px] min-[768px]:bg-[#e7e7e7]
            ${
              isSupportPage
                ? "bg-transparent"
                : isProfilePage
                  ? "bg-gradient-to-r from-[#1a3049] to-[#3f72af] pt-8 min-[768px]:bg-none min-[768px]:pt-5"
                  : "bg-[#e7e7e7]"
            }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
