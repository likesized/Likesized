import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);

  const errorMessage =
    error === "missing_email"
      ? "Enter the email address you use for LikeSized."
      : error === "recovery_failed"
        ? "We could not send that email. Try again in a moment."
        : null;

  return (
    <main className="authShell">
      <section className="authCard">
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1>Reset your password.</h1>
        <p>Enter your email and we will send you a secure reset link.</p>

        {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

        <form className="authForm" action={requestPasswordReset}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button className="primaryButton fullButton" type="submit">Send reset link</button>
        </form>

        <p className="authFootnote">
          Remembered it? <Link href="/login">Back to sign in</Link>.
        </p>
      </section>
    </main>
  );
}
