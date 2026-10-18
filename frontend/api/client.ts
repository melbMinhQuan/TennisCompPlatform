// Every call to the backend goes through this file; the adapters beside it only choose the path.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

/**
 * A failed backend response, keeping the HTTP status so callers can treat 404 differently, the
 * API's error code (e.g. "TEAM_NAME_TAKEN") and its whole answer, which some errors add detail to.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly body: Record<string, unknown> | null = null,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// No network, or an answer that is not the API's JSON: Azure's own page while the backend starts,
// or the static site's index.html when VITE_API_URL is wrong. The technical reason stays off the page.
const SERVER_UNREACHABLE = "We couldn’t reach the server. Please try again in a minute.";

/** The API's explanation: a string, or the list of validation messages a 400 carries. */
function serverMessage(json: Record<string, unknown>) {
  if (typeof json.message === "string") return json.message;
  if (Array.isArray(json.message) && json.message.every((item) => typeof item === "string")) return json.message.join(" ");
  return null;
}

/**
 * Sends one request to the backend and returns its JSON body, or throws with the server's message.
 * A body is sent as JSON, with POST unless another method is given.
 */
export async function request<T>(
  path: string,
  signal: AbortSignal,
  body?: unknown,
  method: Method = body === undefined ? "GET" : "POST",
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ApiError(SERVER_UNREACHABLE, 0);
  }
  const json = await response.json().catch((error: unknown) => {
    if (signal.aborted) throw error;
    return undefined;
  });
  if (json === undefined) throw new ApiError(SERVER_UNREACHABLE, response.status);
  if (!response.ok) {
    const details = json !== null && typeof json === "object" ? (json as Record<string, unknown>) : {};
    throw new ApiError(
      serverMessage(details) ?? `Request failed (${response.status})`,
      response.status,
      typeof details.code === "string" ? details.code : null,
      details,
    );
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

type ClubAdminCall = {
  method?: Method;
  body?: unknown;
  /** Extra query parameters, e.g. the registry search. */
  query?: Record<string, string>;
};

/**
 * Reads or changes the signed-in club administrator's club through /api/v1/club-admin/{path},
 * which answers { data }. The email identifies the administrator, as for players: a local demo
 * lookup, not an authenticated session. The backend works out the club from their role, so no
 * call names a club. Refusals (4xx) keep the server's message and code, because they explain
 * what to change ("A team with this name is already entered in this season"); any other failure
 * is replaced by `failureMessage`.
 */
export async function clubAdminRequest<T>(
  path: string,
  email: string | undefined,
  signal: AbortSignal,
  failureMessage: string,
  { method, body, query }: ClubAdminCall = {},
): Promise<T> {
  // Unreachable through the pages, which only open for a signed-in club administrator.
  if (!email) throw new ApiError("Please log in again.", 401);
  const params = new URLSearchParams({ ...query, email });
  try {
    return (await request<{ data: T }>(`/api/v1/club-admin/${path}?${params}`, signal, body, method)).data;
  } catch (error) {
    if (signal.aborted || (error instanceof ApiError && error.status >= 400 && error.status < 500)) throw error;
    throw new ApiError(failureMessage, error instanceof ApiError ? error.status : 0, error instanceof ApiError ? error.code : null);
  }
}

/** The same call, answering null when the record is not the club's (404) or the ID is not one (400). */
export async function clubAdminRecord<T>(
  path: string,
  email: string | undefined,
  signal: AbortSignal,
  failureMessage: string,
): Promise<T | null> {
  try {
    return await clubAdminRequest<T>(path, email, signal, failureMessage);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}
