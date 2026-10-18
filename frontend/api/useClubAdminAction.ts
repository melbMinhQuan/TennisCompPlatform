import { useContext, useEffect, useRef, useState } from "react";
import { RoleSessionContext } from "../context/RoleSession";
import { ApiError } from "./client";

type Action<T> = (email: string | undefined, signal: AbortSignal) => Promise<T>;

/**
 * Runs one change (or search) as the signed-in club administrator: `busy` while it runs, and
 * `error` with the reason when it fails. `run` answers the result, or undefined when it failed.
 * `explain` can word a refusal from what the page knows, e.g. names instead of Player IDs.
 * Leaving the page drops a late answer; the change itself may still have been saved.
 */
export function useClubAdminAction() {
  const { signedIn } = useContext(RoleSessionContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Aborted when the page closes.
  const page = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    page.current = controller;
    return () => controller.abort();
  }, []);

  async function run<T>(action: Action<T>, explain?: (error: ApiError) => string | null): Promise<T | undefined> {
    const signal = page.current?.signal ?? AbortSignal.abort();
    setBusy(true);
    setError("");
    try {
      return await action(signedIn?.email, signal);
    } catch (failure) {
      if (!signal.aborted) {
        const explained = failure instanceof ApiError ? explain?.(failure) : null;
        setError(explained ?? (failure instanceof Error ? failure.message : "Something went wrong. Please try again."));
      }
      return undefined;
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }

  return { run, busy, error, clearError: () => setError("") };
}
