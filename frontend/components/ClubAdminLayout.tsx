import { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import ClubAdminNavigation from "./layout/ClubAdminNavigation";
import logo from "../resources/Logo.png";
import { useClubAdminUnreadCount } from "../data/club-admin-notification-reads";
import { RoleSessionContext } from "../context/RoleSession";

const ROLE_LABEL = "Club Administrator";

/** "MH" from "Margaret Hayes"; "CA" when the login did not return a name. */
function initialsOf(name: string | null) {
  if (!name) return "CA";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export default function ClubAdminLayout() {
  const { pathname } = useLocation();
  const unreadCount = useClubAdminUnreadCount();
  // The administrator's name and club come from the login response (POST /auth/login).
  const { signedIn, signOut } = useContext(RoleSessionContext);
  const displayName = signedIn?.displayName ?? null;
  const clubName = signedIn?.clubName ?? null;
  const initials = initialsOf(displayName);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const desktop = window.matchMedia("(min-width: 768px)");

    if (desktop.matches) {
      setIsMobileMenuOpen(false);
      return;
    }

    drawer.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnDesktop = () => {
      if (desktop.matches) {
        setIsMobileMenuOpen(false);
      }
    };

    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      drawer.close();
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);

      if (!desktop.matches) {
        menuButtonRef.current?.focus();
      }
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="club-admin-shell flex min-h-dvh flex-col bg-[#1a3049]">
      <a
        href="#club-admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>

      {/* Same header dimensions and logo positioning as Player. */}
      <header className="relative flex h-[72px] shrink-0 items-center bg-gradient-to-r from-[#1a3049] to-[#3f72af] px-4 min-[768px]:h-20 min-[768px]:justify-between min-[768px]:px-5">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open club admin menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-club-admin-menu"
          onClick={() => setIsMobileMenuOpen(true)}
          className="relative z-10 flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white min-[768px]:hidden"
        >
          <span aria-hidden="true">☰</span>
          <span>Menu</span>
        </button>

        <Link
          to="/club-admin"
          aria-label="Waverley Tennis club admin dashboard"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-[768px]:static min-[768px]:translate-x-0 min-[768px]:translate-y-0"
        >
          <img
            src={logo}
            alt="Waverley Tennis"
            className="h-[54px] w-[132px] object-contain min-[768px]:h-[60px] min-[768px]:w-[170px] min-[768px]:object-left"
          />
        </Link>

        {/* Mobile: the admin's initials with "Club Admin" underneath, beside the centred logo. */}
        <div
          role="img"
          aria-label={`${displayName ?? ROLE_LABEL}, ${ROLE_LABEL}`}
          className="relative z-10 ml-auto flex shrink-0 flex-col items-center gap-0.5 min-[768px]:hidden"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#1a3049]">
            {initials}
          </span>
          <span className="whitespace-nowrap text-[11px] font-semibold text-white">Club Admin</span>
        </div>

        <div className="hidden items-center gap-3 min-[768px]:flex">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3049]"
          >
            {initials}
          </span>

          <div>
            <p className="text-sm font-semibold text-white">
              {displayName ?? ROLE_LABEL}
            </p>

            <p className="text-xs leading-5 text-[#d3e0ee]">
              {ROLE_LABEL}
              {clubName ? ` · ${clubName}` : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Same mobile drawer format as Player. */}
      <dialog
        ref={drawerRef}
        id="mobile-club-admin-menu"
        aria-label="Club admin menu"
        onCancel={(event) => {
          event.preventDefault();
          setIsMobileMenuOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setIsMobileMenuOpen(false);
          }
        }}
        className="fixed inset-auto top-[72px] left-0 m-0 h-[calc(100dvh-72px)] max-h-none w-[280px] max-w-[calc(100vw-20px)] overflow-y-auto border-0 bg-[#1a3049] p-0 text-white backdrop:bg-black/35"
      >
        <div className="flex min-h-full flex-col p-5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mb-2.5 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">×</span>
            Close menu
          </button>

          <p className="mb-2.5 text-xs text-slate-300">
            CLUB ADMIN MENU
          </p>

          <ClubAdminNavigation
            mobile
            unreadCount={unreadCount}
            onNavigate={() => setIsMobileMenuOpen(false)}
            onLogOut={signOut}
          />
        </div>
      </dialog>

      <div className="flex flex-1 flex-col min-[768px]:flex-row">
        {/* Same sidebar format as Player. */}
        <aside
          id="club-admin-sidebar"
          className="hidden w-[224px] shrink-0 flex-col px-5 pb-5 pt-5 min-[768px]:flex"
        >
          <p className="mb-3 text-[12px] text-slate-300">
            CLUB ADMIN MENU
          </p>

          <ClubAdminNavigation
            unreadCount={unreadCount}
            onLogOut={signOut}
          />
        </aside>

        <main
          id="club-admin-main"
          tabIndex={-1}
          className="min-w-0 flex-1 p-5 outline-none md:rounded-l-[20px] md:bg-[#eef1f4] md:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
