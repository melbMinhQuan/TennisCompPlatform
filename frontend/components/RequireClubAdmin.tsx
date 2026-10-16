import { useContext, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { homeForRole } from "../api/user-role";
import { RoleSessionContext } from "../context/RoleSession";

/**
 * Shows the club admin pages only to a signed-in club administrator. Anyone not logged in goes to
 * the login page; a signed-in player goes back to their own dashboard.
 */
export default function RequireClubAdmin({ children }: { children: ReactNode }) {
  const { signedIn } = useContext(RoleSessionContext);
  const location = useLocation();

  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (signedIn.role !== "CLUB_ADMIN") return <Navigate to={homeForRole(signedIn.role)} replace />;
  return children;
}
