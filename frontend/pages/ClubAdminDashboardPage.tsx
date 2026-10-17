import { useContext } from "react";
import { getClubAdminDashboard } from "../api/club-admin-dashboard";
import { RoleSessionContext } from "../context/RoleSession";
import { useApiData } from "../api/useApiData";
import ClubAdminDashboardContent from "../components/club-admin/ClubAdminDashboardContent";
import MatchLoadState from "../components/MatchLoadState";
import { pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";

/** Club administrator dashboard (display-only sample data until the club API is connected). */
export default function ClubAdminDashboardPage() {
  const { data, error, retry } = useApiData(getClubAdminDashboard);
  // First name from the login response; the sample's name until the backend sends it.
  const { signedIn } = useContext(RoleSessionContext);
  const firstName = signedIn?.displayName?.split(/\s+/)[0] ?? data?.adminName;
  return (
    <div className={pageClass}>
      <header>
        <h1 className={pageTitleClass}>Welcome{firstName ? `, ${firstName}` : ""}</h1>
        <p className={pageIntroClass}>
          {data ? `${data.club.name} · ` : ""}Manage your players, memberships and teams.
        </p>
      </header>
      {data ? <ClubAdminDashboardContent data={data} /> : <MatchLoadState error={error} retry={retry} />}
    </div>
  );
}
