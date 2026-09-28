import { Link } from "react-router";

export default function Home() {
  return <main className="mx-auto max-w-2xl p-8 text-ink">
    <h1 className="text-3xl font-semibold">Waverley Tennis</h1>
    <p className="mt-4 text-muted">View your player profile, club memberships, competitions and match results.</p>
    <Link to="/login" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-white">Log in</Link>
  </main>;
}
