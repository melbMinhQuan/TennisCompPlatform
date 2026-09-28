import { Link } from "react-router";

export default function PlayerProfileLink({ displayName }: { displayName?: string | null }) {
  const name = displayName?.trim() ?? "";
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${Array.from(parts[0])[0]}${Array.from(parts[parts.length - 1])[0]}`.toUpperCase()
    : (Array.from(parts[0] ?? "")[0] ?? "").toUpperCase();

  return (
    <Link
      to="/dashboard"
      aria-label={name ? `My profile — ${name}` : "My profile"}
      title={name ? `My profile — ${name}` : "My profile"}
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:size-12 md:text-xl"
    >
      {initials ? <span aria-hidden="true">{initials}</span> : (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-6">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
      )}
    </Link>
  );
}
