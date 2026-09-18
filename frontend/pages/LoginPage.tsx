import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { login } from "../api/dashboard";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setError("");

    try {
      // this is where the page calls the login API.
      const response = await login(email.trim().toLowerCase(), password, controller.signal);
      if (controller.signal.aborted) return;
      if (response.result === "login_failed") {
        setError("Incorrect email or password.");
        return;
      }
      setPassword("");
      navigate("/dashboard");
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error instanceof Error ? error.message : "Could not reach the login server.");
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-[#1a3049] to-[#3f72af] px-7 py-[120px]">
      {/* Logo */}
      <img
        src="/resources/Logo.png"
        alt="Waverly Tennis"
        className="absolute left-[32px] top-[10px] h-[80.31px] w-[197.26px] object-contain object-left"
      />

      <section className="w-full max-w-[320px] min-h-[660px]
                          rounded-2xl bg-white
                          px-[25px] pt-[25px] pb-6 shadow-md
                          min-[1280px]:max-w-[440px]
                          min-[1280px]:min-h-[600px]
                          min-[1280px]:px-10"
      >
        {/* Welcome heading */}
        <h1 className="text-center text-[22px] font-semibold 
                      leading-[normal] tracking-normal text-[#1a3049]
                      min-[1280px]:text-[32px]"
        >
          Welcome Back 👋
        </h1>

        {/* Account description */}
        <p className="mt-[27px] text-center text-[14px] font-normal 
                      leading-[normal] tracking-normal text-black
                      min-[1280px]:mt-4
                      min-[1280px]:text-[16px]"
        >
          Login to your Waverly Tennis Account
        </p>
        {/* The form triggers that code the API request itself once it is submitted */}
        <form className="mt-[48px] min-[1280px]:mt-[36px]" onSubmit={handleSubmit}>
          {/* Email input section */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-[16px] font-semibold leading-[19px] text-black 
                        min-[1280px]:-ml-[5px]"
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

              {/* Email input */}
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                className="h-[48px] w-full rounded-[6px] border border-[#a1a3a7] bg-[#e7e7e7] pl-[48px] pr-3 text-[16px] font-normal text-black placeholder:text-black placeholder:opacity-100 focus:outline-2 focus:outline-offset-2 focus:outline-[#3f72af]"
              />
            </div>
          </div>

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

              {/* Password input */}
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[48px] w-full rounded-[6px] border border-[#a1a3a7] bg-[#e7e7e7] pl-[48px] pr-3 text-[16px] font-normal text-black focus:outline-2 focus:outline-offset-2 focus:outline-[#3f72af]"
              />

              {/* Show/hide password button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-controls="password"
                className="absolute left-full top-1/2 flex h-10 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[#888a8e] hover:text-[#1a3049] focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-[#3f72af]"
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

          {/* Remember me and forgot password section */}
          <div className="mt-[21px] flex items-center justify-between">
            {/* Remember me checkbox */}
            <label htmlFor="remember" className="flex cursor-pointer items-center gap-3">
              <span className="relative flex h-5 w-5 shrink-0">
                {/* Checkbox input */}
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border border-black bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
                />

                {/* Checkmark icon */}
                <svg
                  className="pointer-events-none absolute inset-0 h-5 w-5 text-black hidden peer-checked:block"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 10 3 3 7-7" />
                </svg>
              </span>

              <span className="text-[16px] font-normal leading-[22px] text-black">
                Remember me
              </span>
            </label>

            {/* Forgot password button */}
            <button
              type="button"
              className="cursor-pointer text-[16px] font-medium italic leading-[19px] text-[#1a3049] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
            >
              Forgot password?
            </button>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}

          {/* Log in button */}
          <button
            type="submit"
            disabled={busy}
            className="mt-[28px] flex h-[48px] w-full cursor-pointer items-center justify-center rounded-[8px] bg-gradient-to-r from-[#1a3049] to-[#3f72af] text-[18px] font-semibold leading-[22px] text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="mt-[29px] text-center">
          {/* Separator */}
          <div className="-mx-3 flex h-[19px] items-center gap-[10px]">
            <span className="h-px flex-1 bg-[#afafaf]" aria-hidden="true" />
            <span className="text-[16px] font-normal leading-[19px] text-[#afafaf]"> or </span>
            <span className="h-px flex-1 bg-[#afafaf]" aria-hidden="true" />
          </div>

          {/* Don't have an account */}
          <p className="mt-[9px] text-[16px] font-medium italic leading-[19px] text-[#1a3049]">
            Don't have an account?
          </p>

          {/* Sign up button */}
          <button
            type="button"
            className="mx-auto mt-[11px] block h-[25px] w-[114px] cursor-pointer text-[16px] font-bold leading-[19px] text-[#1a3049] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
          >
            Sign up
          </button>
        </div>
      </section>
    </main>
  )
}
