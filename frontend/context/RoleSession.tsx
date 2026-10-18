import { createContext, useState, type ReactNode } from "react";
import type { SignedInRole } from "../api/user-role";

const STORAGE_KEY = "waverley-signed-in-role";

// Kept in sessionStorage so a page reload does not log a club administrator out; it is cleared on
// log out and when the tab closes. A frontend role only chooses what to show: the backend checks
// the role on every club admin request.
function readStoredRole(): SignedInRole | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as Partial<SignedInRole> | null;
    // Saved before the email was kept: the pages cannot load without it, so log in again.
    return typeof stored?.email === "string" && typeof stored.role === "string" ? (stored as SignedInRole) : null;
  } catch {
    return null;
  }
}

function storeRole(value: SignedInRole | null) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the role still works until the page reloads.
  }
}

export const RoleSessionContext = createContext({
  signedIn: null as SignedInRole | null,
  signIn: (_value: SignedInRole) => {},
  signOut: () => {},
});

/** Remembers the signed-in user's role so the app can redirect and protect pages by role. */
export default function RoleSession({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<SignedInRole | null>(readStoredRole);

  const signIn = (value: SignedInRole) => {
    storeRole(value);
    setSignedIn(value);
  };
  const signOut = () => {
    storeRole(null);
    setSignedIn(null);
  };

  return <RoleSessionContext.Provider value={{ signedIn, signIn, signOut }}>{children}</RoleSessionContext.Provider>;
}
