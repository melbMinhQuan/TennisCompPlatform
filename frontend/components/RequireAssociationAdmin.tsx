import { useContext, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { homeForRole } from "../api/user-role";
import { RoleSessionContext } from "../context/RoleSession";

/**
 * Shows the association administrator pages only to a signed-in association administrator
 * (ADMINISTRATOR). Anyone not logged in goes to the login page; anyone else goes to their own home.
 * The backend checks the role on every request too: this only chooses what to show.
 */
export default function RequireAssociationAdmin({ children }: { children: ReactNode }) {
  const { signedIn } = useContext(RoleSessionContext);
  const location = useLocation();

  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (signedIn.role !== "ADMINISTRATOR") return <Navigate to={homeForRole(signedIn.role)} replace />;
  return children;
}
