import PlayerSession from "./context/PlayerSession";
import MyClubsPage from "./pages/MyClubsPage";
import StandingsPage from "./pages/StandingsPage";
import TeamDetailsPage from "./pages/TeamDetailsPage";
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import Home from './pages/Home'
import About from './pages/About'
import DashboardDemo from './pages/DashboardDemo'
import DashboardPage from './pages/DashboardPage'
import './style.css'
import LoginPage from './pages/LoginPage'
import PlayerLayout from "./components/PlayerLayout";
import SupportPage from './pages/SupportPage';
import CompetitionsPage from "./pages/CompetitionsPage";
import CompetitionDetailsPage from "./pages/CompetitionDetailsPage";
import MatchesPage from "./pages/MatchesPage";
import MatchFixturePage from "./pages/MatchFixturePage";
import MatchScorecardPage from "./pages/MatchScorecardPage";
import SiteNavigation from "./components/SiteNavigation";

import ClubAdminLayout from "./components/ClubAdminLayout";
import ClubAdminPlaceholderPage from "./pages/ClubAdminPlaceholderPage";
import ClubAdminSupportPage from "./pages/ClubAdminSupportPage";

function App() {
  return <PlayerSession><BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/home"
        element={<><SiteNavigation /><Home /></>}
      />
      <Route
        path="/about"
        element={<><SiteNavigation /><About /></>}
      />
      <Route path="/demo" element={<DashboardDemo />} />
      <Route path="/dashboard" element={<PlayerLayout />}>
        <Route index element={<DashboardPage />} />

        <Route
          path="competitions"
          element={<CompetitionsPage />}
        />

        <Route
          path="competitions/:entryId"
          element={<CompetitionDetailsPage />}
        />

        <Route
          path="matches"
          element={<MatchesPage />}
        />

        <Route
          path="matches/scorecards/:resultId"
          element={<MatchScorecardPage />}
        />

        <Route
          path="matches/:fixtureId"
          element={<MatchFixturePage />}
        />

        <Route
          path="clubs"
          element={<MyClubsPage />}
        />
        <Route path="clubs/teams/:teamId" element={<TeamDetailsPage />} />

        <Route
          path="rankings"
          element={<StandingsPage />}
        />

        <Route
          path="support"
          element={<SupportPage />}
        />
        <Route path="*" element={<section className="rounded-2xl bg-white p-6"><h1 className="text-2xl font-semibold">Page not found</h1><Link className="mt-4 inline-block text-brand underline" to="/dashboard">Return to your profile</Link></section>} />
      </Route>

      <Route path="/club-admin" element={<ClubAdminLayout />}>
        <Route
          index
          element={<ClubAdminPlaceholderPage title="Dashboard" />}
        />

        <Route
          path="players"
          element={<ClubAdminPlaceholderPage title="Players" />}
        />

        <Route
          path="teams"
          element={<ClubAdminPlaceholderPage title="Teams" />}
        />

        <Route
          path="fixtures"
          element={<ClubAdminPlaceholderPage title="Fixtures & Results" />}
        />

        <Route
          path="notifications"
          element={<ClubAdminPlaceholderPage title="Notifications" />}
        />

        <Route
          path="support"
          element={<ClubAdminSupportPage />}
        />

        <Route
          path="*"
          element={<ClubAdminPlaceholderPage title="Page not found" />}
        />
      </Route>

      <Route path="*" element={<main className="p-8"><h1 className="text-2xl font-semibold">Page not found</h1><Link className="mt-4 inline-block text-brand underline" to="/login">Return to login</Link></main>} />
    </Routes>
  </BrowserRouter></PlayerSession>
}

createRoot(document.getElementById('root')!).render(<App />)
