import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { getDashboard, getMatches, login, type DashboardData, type Page, type ResultItem, type ScheduleItem } from '../api/dashboard'

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{title}</h2>{action}</div>
    {children}
  </section>
}

function dateLabel(date: string | null) {
  if (!date) return 'Date TBD'
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

function MatchList({ items }: { items: (ScheduleItem | ResultItem)[] }) {
  if (!items.length) return <p className="text-slate-500">No records yet.</p>
  return <ul className="divide-y divide-slate-100">
    {items.map(item => <li key={`${item.kind}-${item.id}`} className="py-3 first:pt-0">
      <p className="font-semibold">{item.competition.name}</p>
      <p className="text-sm text-slate-600">{item.round ?? 'Round unavailable'} · {item.event ?? 'Team fixture'}</p>
      <p className="text-sm">{item.opponents.map(p => p.name).join(' / ') || 'Opponent TBD'}</p>
      {item.kind === 'TEAM_FIXTURE'
        ? <><p className="mt-1 text-sm text-slate-500">{dateLabel(item.scheduledDate)} · {item.scheduledTime ?? 'Time TBD'} · {item.status.toLowerCase()}</p><p className="text-xs text-slate-500">Team schedule; individual participation unconfirmed.</p></>
        : <p className="mt-1 text-sm text-slate-500">{dateLabel(item.date)} · {item.score ?? 'Score unavailable'}</p>}
    </li>)}
  </ul>
}

export default function DashboardDemo() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<'schedule' | 'results' | null>(null)
  const [list, setList] = useState<Page<ScheduleItem | ResultItem> | null>(null)
  const [listError, setListError] = useState('')
  const [listBusy, setListBusy] = useState(false)
  const active = useRef<AbortController | null>(null)
  const activeList = useRef<AbortController | null>(null)
  useEffect(() => () => { active.current?.abort(); activeList.current?.abort() }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true); setError(''); setData(null)
    const address = email.trim().toLowerCase()
    try {
      const result = await login(address, password, controller.signal)
      if (controller.signal.aborted) return
      if (result.result !== 'login_success') { setError('Incorrect email or password.'); return }
      setPassword('')
      setLoginEmail(address)
      const dashboard = await getDashboard(address, controller.signal)
      if (!controller.signal.aborted) setData(dashboard)
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not reach the backend.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  async function refresh() {
    if (!loginEmail) return
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true); setError(''); setData(null)
    try {
      const result = await getDashboard(loginEmail, controller.signal)
      if (!controller.signal.aborted) setData(result)
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not fetch dashboard.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  function logout() {
    active.current?.abort(); activeList.current?.abort()
    setLoginEmail(null); setPassword(''); setData(null); setError(''); setBusy(false)
    setView(null); setList(null); setListError(''); setListBusy(false)
  }

  async function openList(nextView: 'schedule' | 'results', cursor?: string) {
    if (!loginEmail) return
    activeList.current?.abort()
    const controller = new AbortController()
    activeList.current = controller
    setView(nextView); setListBusy(true); setListError('')
    if (!cursor) setList(null)
    try {
      const result = await getMatches(loginEmail, nextView, controller.signal, cursor)
      if (!controller.signal.aborted) setList(previous => ({
        ...result, items: cursor ? [...(previous?.items ?? []), ...result.items] : result.items,
      }))
    } catch (err) {
      if (!controller.signal.aborted) setListError(err instanceof Error ? err.message : 'Could not fetch matches.')
    } finally { if (!controller.signal.aborted) setListBusy(false) }
  }

  const button = 'rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
  const link = 'text-sm font-medium text-blue-700 underline underline-offset-4'
  return <main className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-10">
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Database showcase</p><h1 className="mt-1 text-3xl font-bold">Player dashboard</h1><p className="mt-2 text-sm text-slate-600">Local demo: login, then fetch the linked player's information.</p></div>
        {loginEmail && <button className={button} onClick={logout}>Log out / switch account</button>}
      </header>
      {!loginEmail && <div className="mx-auto max-w-md"><Card title="Log in">
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-1">Email<input className="rounded border border-slate-300 p-2" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="grid gap-1">Password<input className="rounded border border-slate-300 p-2" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
          <button className={button} disabled={busy}>{busy ? 'Logging in…' : 'Log in and load dashboard'}</button>
        </form>
      </Card></div>}
      {error && <div role="alert" className="my-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p>{error}</p>
        {loginEmail && <><p className="mt-2 text-sm">Signed in as {loginEmail}.</p><button className={`${link} mt-3`} disabled={busy} onClick={refresh}>Retry database fetch</button></>}
      </div>}
      {busy && loginEmail && <p role="status" className="my-5">Fetching your information…</p>}
      {data && <>
        <div className="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
          <Card title={data.profile.displayName}>
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-semibold text-blue-800">{data.profile.displayName.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
            <p className="mb-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm">{data.profile.status}</p>
            <dl className="space-y-3 text-sm">{[
              ['Age', data.profile.age], ['Gender', data.profile.gender], ['Email', data.profile.email], ['Phone', data.profile.phone],
              ['Club', data.profile.primaryClub?.name], ['Association', data.profile.primaryAssociation?.name],
              ['Teams', data.profile.teams.map(t => t.name).join(', ') || null],
            ].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium">{value ?? 'Not available'}</dd></div>)}</dl>
          </Card>
          <div className="grid gap-5 md:grid-cols-2">
            <Card title="UTR rating"><p className="text-4xl font-bold text-emerald-700">{data.utr.rating?.toFixed(2) ?? 'Not available'}</p><p className="mt-3 text-sm text-slate-500">{data.utr.lastSyncedAt ? `Last synced ${new Date(data.utr.lastSyncedAt).toLocaleDateString()}` : 'No rating sync recorded.'}</p><button disabled className="mt-5 rounded-lg border px-4 py-2 text-sm text-slate-400">UTR history unavailable</button></Card>
            <Card title="Notifications"><p className="text-slate-500">Notifications are not available yet.</p></Card>
            <Card title="Upcoming fixtures" action={<button className={link} onClick={() => openList('schedule')}>Full schedule</button>}><MatchList items={data.upcomingMatches.items} /></Card>
            <Card title="Recent results" action={<button className={link} onClick={() => openList('results')}>View all</button>}><MatchList items={data.recentMatches.items} /></Card>
            <div className="md:col-span-2"><Card title="Career summary"><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[
              ['Matches played', data.careerSummary.matchesPlayed], ['Win %', data.careerSummary.winPercentage],
              ['Titles', data.careerSummary.titlesWon], ['Best UTR rank', data.careerSummary.bestUtrRank],
            ].map(([label, value]) => <div key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value ?? '—'}</p></div>)}</div><p className="mt-4 text-xs text-slate-500">Totals use finalised personal results. Unknown outcomes and unavailable metrics are not estimated.</p></Card></div>
          </div>
        </div>
        {view && <div className="mt-5"><Card title={view === 'schedule' ? 'Full schedule' : 'All recent results'} action={<button className={link} onClick={() => { activeList.current?.abort(); setView(null); setList(null); setListBusy(false) }}>Close</button>}>
          {list && <MatchList items={list.items} />}
          {listBusy && <p role="status" className="mt-3">Loading…</p>}
          {listError && <p role="alert" className="mt-3 text-red-700">{listError}</p>}
          {list?.hasMore && <button className={`${button} mt-4`} disabled={listBusy} onClick={() => openList(view, list.nextCursor!)}>Load more</button>}
        </Card></div>}
        <details className="mt-6 rounded-lg bg-slate-900 p-4 text-slate-100"><summary className="cursor-pointer">See the actual API response</summary><pre className="mt-4 overflow-auto text-xs">{JSON.stringify({ data }, null, 2)}</pre></details>
      </>}
    </div>
  </main>
}
