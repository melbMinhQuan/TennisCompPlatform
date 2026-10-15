import { getClubAdminDashboard } from "../api/club-admin-dashboard";
import { useApiData } from "../api/useApiData";
import ClubAdminDashboardContent from "../components/club-admin/ClubAdminDashboardContent";
import MatchLoadState from "../components/MatchLoadState";
import { pageClass, pageIntroClass, pageTitleClass } from "../components/MatchesUI";

/** Club administrator dashboard (display-only sample data until the club API is connected). */
export default function ClubAdminDashboardPage() {
  const { data, error, retry } = useApiData(getClubAdminDashboard);
  return (
    <div className={pageClass}>
      <header>
        <h1 className={pageTitleClass}>Welcome{data ? `, ${data.adminName}` : ""}</h1>
        <p className={pageIntroClass}>
          {data ? `${data.club.name} · ` : ""}Manage your players, memberships and teams.
        </p>
      </header>
      {data ? <ClubAdminDashboardContent data={data} /> : <MatchLoadState error={error} retry={retry} />}
    </div>
  );
}
