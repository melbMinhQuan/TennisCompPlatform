import { createContext, useEffect, useState, type ReactNode } from "react";
import { getDashboard, type DashboardData } from "../api/dashboard";

// In-memory local-demo lookup, not a server-authenticated session.
export const PlayerSessionContext = createContext({
  email: "", setEmail: (_email: string) => {}, data: null as DashboardData | null,
  error: "", loading: false, reload: () => {},
});

export default function PlayerSession({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ email: string; data: DashboardData | null; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult(null);
    if (!email) return;
    const controller = new AbortController();
    async function load() {
      try {
        const data = await getDashboard(email, controller.signal);
        if (!controller.signal.aborted) setResult({ email, data, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ email, data: null, error: error instanceof Error ? error.message : "Could not load your memberships." });
      }
    }
    void load();
    return () => controller.abort();
  }, [email, attempt]);
  const current = result?.email === email ? result : null;
  return <PlayerSessionContext.Provider value={{ email, setEmail, data: current?.data ?? null, error: current?.error ?? "", loading: !!email && !current, reload: () => { setResult(null); setAttempt(a => a + 1); } }}>{children}</PlayerSessionContext.Provider>;
}
