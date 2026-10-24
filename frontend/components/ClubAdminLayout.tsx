import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import ClubAdminNavigation from "./layout/ClubAdminNavigation";
import ClubAdminHeader from "./layout/ClubAdminHeader";
import { ClubAdminNotificationsContext } from "../context/ClubAdminNotifications";
import { RoleSessionContext } from "../context/RoleSession";

/** "MH" from "Margaret Hayes"; "CA" when the login did not return a name. */
function initialsOf(name: string | null) {
  if (!name) return "CA";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export default function ClubAdminLayout() {
  const { pathname } = useLocation();
  const unreadCount = useContext(ClubAdminNotificationsContext).unreadCount ?? 0;
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
			<ClubAdminHeader
				displayName={displayName}
				clubName={clubName}
				initials={initials}
				isMenuOpen={isMobileMenuOpen}
				onOpenMenu={() => setIsMobileMenuOpen(true)}
				menuButtonRef={menuButtonRef}
			/>

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
