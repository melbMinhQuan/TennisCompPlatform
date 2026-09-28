import { useState } from "react";

/** "Forgot password?" link that explains how to recover access (no online reset yet). */
export default function ForgotPasswordHelp() {
  const [showResetInfo, setShowResetInfo] = useState(false);
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setShowResetInfo((value) => !value)}
        aria-expanded={showResetInfo}
        aria-controls="password-help"
        className="min-h-11 rounded text-sm font-medium text-ink hover:underline"
      >
        Forgot password?
      </button>
      <p id="password-help" hidden={!showResetInfo} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-muted">
        Contact your club administrator to recover access to your account. Online password reset is not available yet.
      </p>
    </div>
  );
}
