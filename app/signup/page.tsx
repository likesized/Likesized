import Link from "next/link";
import { signup } from "@/app/auth/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);

  const errorMessage =
    error === "invalid_signup"
      ? "Enter a valid email and a password with at least 8 characters."
      : error === "signup_failed"
        ? "We could not create that account. Try again in a moment."
        : null;

  return (
    <main className="authShell">
      <section className="authCard">
        <span className="eyebrow">BUILD YOUR FIT PROFILE</span>
        <h1>Create your LikeSized account.</h1>
        <p>Your exact body measurements stay private by default.</p>

        {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

        <form className="authForm" action={signup}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className="primaryButton fullButton" type="submit">Create account</button>
        </form>

        <p className="authFootnote">
          Already have an account? <Link href="/login">Sign in</Link>.
        </p>
      </section>
    </main>
  );
}
