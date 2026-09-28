import { useState } from "react";

/** Password input with a lock icon and a show/hide button. */
export default function PasswordField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="mt-[36px]">
      <label htmlFor="password" className="-ml-[1px] block text-[16px] font-semibold leading-[19px] text-black">
        Password
      </label>

      <div className="relative mt-[8px]">
        {/* Lock icon */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#888a8e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>

        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[48px] w-full rounded-[6px] border border-[#a1a3a7] bg-[#e7e7e7] pl-[48px] pr-12 text-[16px] font-normal text-black focus:outline-2 focus:outline-offset-2 focus:outline-[#3f72af]"
        />

        <button
          type="button"
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-controls="password"
          className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[#888a8e] hover:text-[#1a3049] focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-[#3f72af]"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            {showPassword && <path d="M3 3 21 21" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
