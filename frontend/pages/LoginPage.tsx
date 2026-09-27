import { PlayerSessionContext } from "../context/PlayerSession";
import { useContext, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { login } from "../api/dashboard";
import logo from "../resources/Logo.png";
import EmailField from "../components/login/EmailField";
import ForgotPasswordHelp from "../components/login/ForgotPasswordHelp";
import PasswordField from "../components/login/PasswordField";
import SignUpHelp from "../components/login/SignUpHelp";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const { setEmail: setPlayerEmail } = useContext(PlayerSessionContext);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlayerEmail("");
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setError("");

    try {
      // this is where the page calls the login API.
      const response = await login(email.trim().toLowerCase(), password, controller.signal);
      if (controller.signal.aborted) return;
      if (response.result !== "login_success") {
        setError("Incorrect email or password.");
        return;
      }
      setPlayerEmail(email.trim().toLowerCase());
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
      <img
        src={logo}
        alt="Waverley Tennis"
        className="absolute left-[32px] top-[10px] h-[80.31px] w-[197.26px] object-contain object-left"
      />

      <section className="w-full max-w-[320px] min-h-[660px] rounded-2xl bg-white px-[25px] pt-[25px] pb-6 shadow-md min-[1280px]:max-w-[440px] min-[1280px]:min-h-[600px] min-[1280px]:px-10">
        <h1 className="text-center text-[22px] font-semibold leading-[normal] tracking-normal text-[#1a3049] min-[1280px]:text-[32px]">
          Welcome Back 👋
        </h1>

        <p className="mt-[27px] text-center text-[14px] font-normal leading-[normal] tracking-normal text-black min-[1280px]:mt-4 min-[1280px]:text-[16px]">
          Login to your Waverley Tennis Account
        </p>

        {/* Submitting the form sends the email and password to the login API. */}
        <form className="mt-[48px] min-[1280px]:mt-[36px]" onSubmit={handleSubmit}>
          <EmailField value={email} onChange={setEmail} />
          <PasswordField value={password} onChange={setPassword} />
          <ForgotPasswordHelp />

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-[28px] flex h-[48px] w-full cursor-pointer items-center justify-center rounded-[8px] bg-gradient-to-r from-[#1a3049] to-[#3f72af] text-[18px] font-semibold leading-[22px] text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>

        <SignUpHelp />
      </section>
    </main>
  );
}
