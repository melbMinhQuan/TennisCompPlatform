import { NavLink, Link } from "react-router";

const MENU_ITEMS = [
  { label: "Profile", to: "/dashboard", end: true },
  { label: "Competitions", to: "/dashboard/competitions" },
  { label: "Matches", to: "/dashboard/matches" },
  { label: "My Clubs & Associations & Teams", to: "/dashboard/clubs" },
  { label: "Standings & Rankings", to: "/dashboard/rankings" },
];

const menuClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex min-h-[48px] items-center justify-center",
    "rounded-[8px] px-3 py-3 text-center text-[14px]",
    "transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-white",
    isActive ? "bg-[#3f72af] text-white" : "text-white hover:bg-white/10",
  ].join(" ");

type PlayerNavigationProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
};

/** Player menu links, Help & Support and Log out. Used in the desktop sidebar and the mobile drawer. */
export default function PlayerNavigation({ mobile = false, onNavigate, onLogout }: PlayerNavigationProps) {
  const gap = mobile ? "gap-2.5" : "gap-2";

  return (
    <>
      <nav aria-label={mobile ? "Mobile player menu" : "Player menu"} className={`flex flex-col ${gap}`}>
        {MENU_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={menuClass} onClick={onNavigate}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={`mt-auto flex flex-col ${gap} pt-12`}>
        <NavLink to="/dashboard/support" className={menuClass} onClick={onNavigate}>
          Help &amp; Support
        </NavLink>

        <Link
          to="/login"
          onClick={() => {
            onLogout();
            onNavigate?.();
          }}
          className="flex min-h-12 items-center justify-center rounded-lg text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          Log out
        </Link>
      </div>
    </>
  );
}
