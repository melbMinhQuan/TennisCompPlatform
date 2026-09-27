import { useState } from "react";

/** "Don't have an account? Sign up": players are registered by their club, so this explains how. */
export default function SignUpHelp() {
  const [showSignupInfo, setShowSignupInfo] = useState(false);
  return (
    <div className="mt-[29px] text-center">
      {/* Separator */}
      <div className="-mx-3 flex h-[19px] items-center gap-[10px]">
        <span className="h-px flex-1 bg-[#afafaf]" aria-hidden="true" />
        <span className="text-[16px] font-normal leading-[19px] text-muted"> or </span>
        <span className="h-px flex-1 bg-[#afafaf]" aria-hidden="true" />
      </div>

      <p className="mt-[9px] text-[16px] font-medium italic leading-[19px] text-[#1a3049]">Don't have an account?</p>

      <button
        type="button"
        onClick={() => setShowSignupInfo((previous) => !previous)}
        aria-expanded={showSignupInfo}
        aria-controls="signup-info"
        className="mx-auto mt-[11px] flex min-h-11 items-center justify-center rounded px-4 text-[16px] font-bold text-[#1a3049] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
      >
        Sign up
      </button>

      <div
        id="signup-info"
        hidden={!showSignupInfo}
        className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left"
      >
        <h2 className="text-sm font-semibold text-[#1a3049]">Register through your club</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Contact your club administrator to register or link your existing player record. Use the account they
          provide to log in.
        </p>
      </div>
    </div>
  );
}
