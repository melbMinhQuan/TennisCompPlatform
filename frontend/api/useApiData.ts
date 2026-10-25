import { useCallback, useContext, useEffect, useState } from "react";
import { PlayerSessionContext } from "../context/PlayerSession";
import { RoleSessionContext } from "../context/RoleSession";

type Load<T> = (signal: AbortSignal, identity?: string) => Promise<T>;

/**
 * Loads data through an API adapter as `identity`, reloading when the identity or the adapter
 * changes. An answer is kept with the identity and adapter it was asked for, so data for a
 * previous player, or a previous team when a page passes a new adapter, is never shown.
 */
function useLoad<T>(load: Load<T>, identity: string) {
  const [result, setResult] = useState<{
    identity: string;
    load: Load<T>;
    data?: T;
    error?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    async function fetchData() {
      try {
        const data = await load(controller.signal, identity || undefined);
        if (!controller.signal.aborted) setResult({ identity, load, data });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            identity,
            load,
            error:
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
          });
      }
    }
    void fetchData();
    return () => controller.abort();
  }, [identity, attempt, load]);
  const current = result?.identity === identity && result.load === load ? result : null;
  /** Replaces the loaded data, e.g. with what a change answered, without loading again. */
  const setData = useCallback(
    (update: (data: T) => T) =>
      setResult((previous) =>
        previous?.identity === identity && previous.load === load && previous.data !== undefined
          ? { ...previous, data: update(previous.data) }
          : previous,
      ),
    [identity, load],
  );
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    retry: () => setAttempt((attempt) => attempt + 1),
    setData,
  };
}

/** Loads data through an API adapter, reloading when the logged-in player changes. */
export function useApiData<T>(load: Load<T>) {
  const { email } = useContext(PlayerSessionContext);
  return useLoad(load, email);
}

/** The same for the club administrator pages, as the signed-in administrator. */
export function useClubAdminData<T>(load: Load<T>) {
  const { signedIn } = useContext(RoleSessionContext);
  return useLoad(load, signedIn?.email ?? "");
}

/** The same for the association administrator pages: they too identify the signed-in role holder. */
export const useAssociationAdminData = useClubAdminData;
