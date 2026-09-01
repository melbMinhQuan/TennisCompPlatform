import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import Home from './pages/Home'
import About from './pages/About'
import './style.css'

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
        </div>
      </details>
      <div className="hidden gap-4 md:flex">
        <Link to="/">Home</Link>
        <Link to="/about">About us</Link>
      </div>
    </div>
  </nav>
}

function App() {
  return <BrowserRouter>
    <Navigation />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </BrowserRouter>
}

createRoot(document.getElementById('root')!).render(<App />)
