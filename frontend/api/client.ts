// Every call to the backend goes through this file; the adapters beside it only choose the path.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

/** A failed backend response, keeping the HTTP status so callers can treat 404 differently. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Sends one request to the backend and returns its JSON body, or throws with the server's message. */
export async function request<T>(path: string, signal: AbortSignal, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    method: body === undefined ? "GET" : "POST",
    signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new ApiError(typeof json.message === "string" ? json.message : `Request failed (${response.status})`, response.status);
  }
  return json as T;
}

/**
 * Loads one of the logged-in player's resources from /api/v1/player/{resource}.
 * The email identifies the player: a local demo lookup, not an authenticated session.
 * A 404 keeps the server's explanation (e.g. "no linked player profile"); any other
 * failure is replaced by `failureMessage`, so players never see technical detail.
 */
export async function getPlayerData<T>(
  resource: string,
  email: string,
  signal: AbortSignal,
  failureMessage: string,
): Promise<T> {
  const query = new URLSearchParams({ email });
  try {
    return (await request<{ data: T }>(`/api/v1/player/${resource}?${query}`, signal)).data;
  } catch (error) {
    if (signal.aborted || (error instanceof ApiError && error.status === 404)) throw error;
    throw new ApiError(failureMessage, error instanceof ApiError ? error.status : 0);
  }
}
