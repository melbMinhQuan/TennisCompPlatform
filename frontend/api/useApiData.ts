import { useContext, useEffect, useState } from "react";
import { PlayerSessionContext } from "../context/PlayerSession";

/** Loads data through an API adapter, reloading when the logged-in player changes. */
export function useApiData<T>(
  load: (signal: AbortSignal, identity?: string) => Promise<T>,
) {
  const { email } = useContext(PlayerSessionContext);
  const [result, setResult] = useState<{
    identity: string;
    data?: T;
    error?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    async function fetchData() {
      try {
        const data = await load(controller.signal, email);
        if (!controller.signal.aborted) setResult({ identity: email, data });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            identity: email,
            error:
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
          });
      }
    }
    void fetchData();
    return () => controller.abort();
  }, [email, attempt, load]);
  const current = result?.identity === email ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    retry: () => setAttempt((n) => n + 1),
  };
}
