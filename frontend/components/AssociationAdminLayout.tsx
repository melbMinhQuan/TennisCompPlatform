import { useContext } from "react";
import { Link, Outlet } from "react-router";
import logo from "../resources/Logo.png";
import { PlayerSessionContext } from "../context/PlayerSession";
import { RoleSessionContext } from "../context/RoleSession";

const ROLE_LABEL = "Association Administrator";

/** The association administrator's pages: the same header as the club admin pages, one page for now. */
export default function AssociationAdminLayout() {
  const { signedIn, signOut } = useContext(RoleSessionContext);
  const { setEmail: setPlayerEmail } = useContext(PlayerSessionContext);
  const displayName = signedIn?.displayName ?? ROLE_LABEL;

  return (
    <div className="flex min-h-dvh flex-col bg-[#1a3049]">
      <a
        href="#association-admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <header className="flex min-h-[72px] shrink-0 flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#1a3049] to-[#3f72af] px-4 py-2 min-[768px]:h-20 min-[768px]:px-5">
        <Link to="/association-admin" aria-label="Waverley Tennis association administration">
          <img src={logo} alt="Waverley Tennis" className="h-[54px] w-[132px] object-contain object-left min-[768px]:h-[60px] min-[768px]:w-[170px]" />
        </Link>
        <nav aria-label="Association admin menu" className="flex flex-wrap items-center gap-2 text-sm text-white">
          <span className="mr-2 text-right leading-5">
            <span className="block font-semibold">{displayName}</span>
            <span className="block text-xs text-[#d3e0ee]">{ROLE_LABEL}</span>
          </span>
          {/* An administrator who also plays still has their own player dashboard. */}
          <Link to="/dashboard" className="flex min-h-11 items-center rounded-lg px-3 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
            My player profile
          </Link>
          <Link
            to="/login"
            onClick={() => {
              signOut();
              setPlayerEmail("");
            }}
            className="flex min-h-11 items-center rounded-lg px-3 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            Log out
          </Link>
        </nav>
      </header>
      <main id="association-admin-main" tabIndex={-1} className="min-w-0 flex-1 p-5 outline-none md:rounded-tl-[20px] md:bg-[#eef1f4] md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
