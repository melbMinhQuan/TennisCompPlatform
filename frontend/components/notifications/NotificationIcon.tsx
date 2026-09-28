import type { ReactNode } from "react";

type IconStyle = { circle: string; glyph: ReactNode };

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

// One colour and glyph per notification type, as in the dashboard design.
const ICONS: Record<string, IconStyle> = {
  MATCH_DATE_CHANGED: {
    circle: "bg-[#fbe9ea] text-[#b83a3a]",
    glyph: (
      <g {...STROKE}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16M13 15l2 2 3-3" />
      </g>
    ),
  },
  VENUE_CHANGED: {
    circle: "bg-[#e8eefb] text-[#3b6fd8]",
    glyph: <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />,
  },
  DRAW_RELEASED: {
    circle: "bg-[#fdf5e2] text-[#c99a2e]",
    glyph: (
      <path
        fill="currentColor"
        d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.4A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.4 12H8a4 4 0 0 1-4-4V5h3V3Zm0 4H6v1a2 2 0 0 0 1 1.7V7Zm10 0v2.7A2 2 0 0 0 18 8V7h-1Z"
      />
    ),
  },
  MATCH_REMINDER: {
    circle: "bg-[#e8f5ec] text-[#3f9a5a]",
    glyph: (
      <g {...STROKE}>
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20a2 2 0 0 0 4 0" />
        <circle cx="18.5" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
      </g>
    ),
  },
};

// Types without their own design (results, disputes, updates) share a neutral bell.
const GENERIC_ICON: IconStyle = {
  circle: "bg-slate-100 text-slate-500",
  glyph: <path {...STROKE} d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20a2 2 0 0 0 4 0" />,
};

/** The coloured circle at the start of a notification row. Decorative: the title says what it is. */
export default function NotificationIcon({ type }: { type: string }) {
  const icon = ICONS[type] ?? GENERIC_ICON;
  return (
    <span aria-hidden="true" className={`flex size-14 shrink-0 items-center justify-center rounded-full ${icon.circle}`}>
      <svg viewBox="0 0 24 24" className="size-6">
        {icon.glyph}
      </svg>
    </span>
  );
}
