import { useState, type FormEvent } from 'react'

const apiUrl = import.meta.env.VITE_API_URL

export default function Home() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const response = await fetch(`${apiUrl}/player-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const { role } = await response.json()
    setMessage(`You are ${role}.`)
  }

  return <main className="mx-auto mt-24 max-w-md rounded-xl bg-white p-8 shadow-lg">
    <h1 className="text-3xl font-bold text-slate-900">TennisComp</h1>
    <form className="mt-6 grid gap-3" onSubmit={submit}>
      <label className="font-medium text-slate-700">Enter your name:</label>
      <input className="rounded border border-slate-300 p-2" value={name} onChange={e => setName(e.target.value)} placeholder="john or johnny" />
      <button className="rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700">Check role</button>
    </form>
    {message && <p className="mt-5 text-lg text-slate-700">{message}</p>}
  </main>
}
