import { Link } from "react-router";

/** Top menu for the public Home and About pages. */
export default function SiteNavigation() {
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
          <Link to="/home">Home</Link>
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
