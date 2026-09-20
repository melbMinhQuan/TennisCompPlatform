import { NavLink, Outlet, Link } from "react-router";
import logo from "../resources/Logo.png";

const menuItems = [
  { label: "Profile", to: "/dashboard", end: true },
  { label: "Competitions", to: "/dashboard/competitions" },
  { label: "Matches", to: "/dashboard/matches" },
  { label: "My Clubs & Association", to: "/dashboard/clubs" },
  { label: "Standings & Rankings", to: "/dashboard/rankings" },
];

export default function PlayerLayout() {
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
    <div className="flex min-h-screen flex-col bg-[#1a3049]">
      {/* Top bar */}
      <header
        className="flex h-[80px] shrink-0 items-center justify-between
          bg-gradient-to-r from-[#1a3049] to-[#3f72af]
          px-5"
      >
        <Link to="/dashboard" aria-label="Waverley Tennis profile">
          <img
            src={logo}
            alt="Waverley Tennis"
            className="h-[60px] w-[170px] object-contain object-left"
          />
        </Link>

        <Link
          to="/dashboard"
          className="rounded-[8px] bg-[#1a3049]
            px-6 py-3 text-[14px] text-white
            hover:bg-[#24415f]"
        >
          My profile
        </Link>
      </header>

      <div className="flex flex-1">
        {/* Left sidebar */}
        <aside className="flex w-[224px] shrink-0 flex-col px-5 pb-5 pt-5">
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
        <main className="min-w-0 flex-1 rounded-l-[20px] bg-[#e7e7e7] p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
