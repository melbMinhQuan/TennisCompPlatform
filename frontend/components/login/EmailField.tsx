export default function EmailField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label
        htmlFor="email"
        className="block text-[16px] font-semibold leading-[19px] text-black min-[1280px]:-ml-[5px]"
      >
        Email address
      </label>

      <div className="relative mt-[12px] min-[1280px]:mt-[9px]">
        {/* Email icon */}
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
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m2 6 10 6 10-6" />
        </svg>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="example@email.com"
          className="h-[48px] w-full rounded-[6px] border border-[#a1a3a7] bg-[#e7e7e7] pl-[48px] pr-12 text-[16px] font-normal text-black placeholder:text-black placeholder:opacity-100 focus:outline-2 focus:outline-offset-2 focus:outline-[#3f72af]"
        />
      </div>
    </div>
  );
}
