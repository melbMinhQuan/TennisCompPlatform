import { Link, NavLink } from "react-router";

const MENU_ITEMS = [
  { label: "Dashboard", to: "/club-admin", end: true },
  { label: "Players", to: "/club-admin/players" },
  { label: "Teams", to: "/club-admin/teams" },
  { label: "Fixtures & Results", to: "/club-admin/fixtures" },
  { label: "Notifications", to: "/club-admin/notifications" },
];

const menuClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex min-h-[48px] items-center justify-center",
    "rounded-[8px] px-3 py-3 text-center text-[14px]",
    "transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-white",
    isActive
      ? "bg-[#3f72af] text-white"
      : "text-white hover:bg-white/10",
  ].join(" ");

type ClubAdminNavigationProps = {
  mobile?: boolean;
  unreadCount: number;
  onNavigate?: () => void;
};

export default function ClubAdminNavigation({
  mobile = false,
  unreadCount,
  onNavigate,
}: ClubAdminNavigationProps) {
  const gap = mobile ? "gap-2.5" : "gap-2";

  return (
    <>
      <nav
        aria-label={
          mobile ? "Mobile club admin menu" : "Club admin menu"
        }
        className={`flex flex-col ${gap}`}
      >
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={menuClass}
            onClick={onNavigate}
          >
            {item.label}
            {item.to === "/club-admin/notifications" &&
              unreadCount > 0 &&
              ` (${unreadCount})`}
          </NavLink>
        ))}
      </nav>

      <div className={`mt-auto flex flex-col ${gap} pt-12`}>
        <NavLink
          to="/club-admin/support"
          className={menuClass}
          onClick={onNavigate}
        >
          Help &amp; Support
        </NavLink>

        <Link
          to="/login"
          onClick={onNavigate}
          className="flex min-h-12 items-center justify-center rounded-lg text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          Log out
        </Link>
      </div>
    </>
  );
}