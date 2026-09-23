import { useContext } from "react";
import { Link } from "react-router";
import { PlayerSessionContext } from "../context/PlayerSession";

const CARD_CLASS = "rounded-2xl border border-[#dce4ee] bg-white p-6";

export default function MyClubsPage() {
  const { email, data, error, loading, reload } = useContext(PlayerSessionContext);
  const profile = data?.profile;
  return (
    <div className="mx-auto max-w-6xl space-y-5 leading-[1.45] md:space-y-6 md:rounded-3xl md:bg-[#eff1f4] md:p-8">
      <header className="space-y-2">
        <h1 className="text-[28px] font-semibold text-white md:text-[34px] md:text-[#1a3049]">My Clubs &amp; Associations &amp; Teams</h1>
        <p className="text-sm text-white md:text-[#596b80]">View your memberships and the teams you belong to.</p>
      </header>
      {!email ? (
        <section className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-[#1a3049]">Log in to see your memberships</h2>
          <p className="mt-3 text-sm text-[#596b80]">Your available clubs, associations, and teams will appear here after you log in.</p>
          <Link to="/login" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#1a3049] px-4 text-sm text-white">Log in</Link>
        </section>
      ) : loading ? <p role="status" className={CARD_CLASS}>Loading your clubs, associations, and teams…</p> : error ? (
        <section className={CARD_CLASS}>
          <h2 className="text-lg font-semibold text-[#1a3049]">We couldn’t load your memberships</h2>
          <p role="alert" className="mt-3 text-sm text-[#596b80]">{error}</p>
          <button type="button" onClick={reload} className="mt-4 min-h-11 rounded-lg bg-[#1a3049] px-4 text-sm text-white">Try again</button>
        </section>
      ) : profile && (
        <>
          <section className="space-y-3 rounded-2xl bg-[#1a3049] p-6 text-white">
            <h2 className="break-words text-lg font-semibold">{profile.displayName}</h2>
            <p className="break-all text-xs text-blue-100">Player ID: {profile.id}</p>
            <p className="text-sm text-blue-100">Showing available primary memberships. Your full membership list is not available yet.</p>
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${CARD_CLASS} space-y-3`}>
            <h2 className="text-lg font-semibold text-[#1a3049]">My Clubs</h2>
            <p className="font-semibold text-[#1a3049]">{profile.primaryClub?.name ?? "No primary club recorded"}</p>
            {profile.primaryClub ? (
              <>
                <span className="inline-block rounded-md bg-[#e7f4ec] px-3 py-2 text-xs font-semibold text-[#267054]">PRIMARY CLUB</span>
                <p className="text-[13px] text-[#596b80]">Membership start date and club contact details are not available yet.</p>
              </>
            ) : <p className="text-[13px] text-[#596b80]">A primary club has not been provided. You may still belong to other clubs. Ask your club administrator to confirm your membership.</p>}
          </section>
          <section className={`${CARD_CLASS} space-y-3`}>
            <h2 className="text-lg font-semibold text-[#1a3049]">My Associations</h2>
            {profile.primaryAssociation ? (
              <><p className="font-semibold text-[#1a3049]">{profile.primaryAssociation.name}</p><p className="text-[13px] text-[#596b80]">Primary association</p></>
            ) : <p className="text-[13px] text-[#596b80]">No primary association recorded. Other association memberships are not available here yet.</p>}
          </section>
          </div>
          <section className={`${CARD_CLASS} space-y-3`}>
            <h2 className="text-lg font-semibold text-[#1a3049]">My Teams <span className="ml-2 rounded-full bg-blue-50 px-2.5 py-1 text-sm text-[#315f96]">{profile.teams.length}</span></h2>
            {profile.teams.length === 0 ? <p className="text-[13px] text-[#596b80]">No active team assignments recorded.</p> : (
              <><ul className="grid gap-3 text-[#1a3049] sm:grid-cols-2">{profile.teams.map(team => <li key={team.id} className="rounded-lg border border-[#dce4ee] bg-slate-50 p-4 font-semibold">{team.name}</li>)}</ul><p className="text-[13px] text-[#596b80]">The club, competition, and section for each team are not available yet.</p></>
            )}
          </section>
          <section className={`${CARD_CLASS} space-y-3`}>
            <h2 className="text-lg font-semibold text-[#1a3049]">More membership information</h2>
            <p className="text-[13px] text-[#596b80]">Additional clubs and associations, membership dates, and team competition details are not available on this page yet.</p>
          </section>
        </>
      )}
      <p className="text-[13px] text-white md:text-[#596b80]">Membership changes are managed by your club administrator.</p>
    </div>
  );
}
