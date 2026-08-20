import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);

  const errorMessage =
    error === "invalid_password"
      ? "Use at least 8 characters and make sure both passwords match."
      : error === "invalid_session"
        ? "That reset link is no longer valid. Request a new one."
        : error === "update_failed"
          ? "We could not update your password. Try again in a moment."
          : null;

  return (
    <main className="authShell">
      <section className="authCard">
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1>Choose a new password.</h1>
        <p>Set a new password for your LikeSized account.</p>

        {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

        <form className="authForm" action={updatePassword}>
          <label>
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className="primaryButton fullButton" type="submit">Update password</button>
        </form>

        <p className="authFootnote">
          Need a new link? <Link href="/forgot-password">Start over</Link>.
        </p>
      </section>
    </main>
  );
}
