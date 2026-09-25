import PlayerSession from "./context/PlayerSession";
import MyClubsPage from "./pages/MyClubsPage";
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

function Navigation() {
  return <nav className="bg-slate-900 text-white">
    <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
      <Link className="font-bold" to="/">TennisComp</Link>
      <details className="relative md:hidden">

        <summary className="cursor-pointer list-none" aria-label="Open menu">
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </summary>
        
        <div className="absolute right-0 top-8 z-10 grid w-32 gap-3 rounded bg-slate-800 p-4">
          <Link to="/">Home</Link>
          <Link to="/about">About us</Link>
          <Link to="/demo">Dashboard demo</Link>
        </div>
      </details>
      <div className="hidden gap-4 md:flex">
        <Link to="/home">Home</Link>
        <Link to="/about">About us</Link>
        <Link to="/demo">Dashboard demo</Link>
      </div>
    </div>
  </nav>
}

function ComingSoonPage({ title }: { title: string }) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h1 className="text-2xl font-semibold text-[#1a3049]">
        {title}
      </h1>
      <p className="mt-3 text-slate-600">
        This page is under development.
      </p>
    </section>
  );
}

function App() {
  return <PlayerSession><BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/home"
        element={<><Navigation /><Home /></>}
      />
      <Route
        path="/about"
        element={<><Navigation /><About /></>}
      />
      <Route path="/demo" element={<DashboardDemo />} />
      <Route path="/dashboard" element={<PlayerLayout />}>
        <Route index element={<DashboardPage />} />

        <Route
          path="competitions"
          element={<ComingSoonPage title="Competitions" />}
        />

        <Route
          path="matches"
          element={<ComingSoonPage title="Matches" />}
        />

        <Route
          path="clubs"
          element={<MyClubsPage />}
        />

        <Route
          path="rankings"
          element={<ComingSoonPage title="Standings & Rankings" />}
        />

        <Route
          path="support"
          element={<SupportPage />}
        />
      </Route>
    </Routes>
  </BrowserRouter></PlayerSession>
}

createRoot(document.getElementById('root')!).render(<App />)
