import Link from "next/link";
import { login } from "@/app/auth/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);
  const next = first(params.next) ?? "/people";

  const errorMessage =
    error === "missing_fields"
      ? "Enter your email and password."
      : error === "invalid_credentials"
        ? "That email and password combination did not work."
        : null;

  return (
    <main className="authShell">
      <section className="authCard">
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Sign in to LikeSized.</h1>
        <p>Get back to your Fit Profile, closet, and people built like you.</p>

        {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

        <form className="authForm" action={login}>
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primaryButton fullButton" type="submit">Sign in</button>
        </form>

        <p className="authFootnote">
          New here? <Link href="/signup">Create an account</Link>.
        </p>
      </section>
    </main>
  );
}
