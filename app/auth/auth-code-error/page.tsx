import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <span className="eyebrow">SIGN-IN LINK PROBLEM</span>
        <h1>That link could not be verified.</h1>
        <p>
          The link may have expired or already been used. Try signing in again or
          create a new account.
        </p>
        <div className="authActions">
          <Link className="primaryButton" href="/login">Try sign in again</Link>
          <Link className="secondaryButton" href="/signup">Create account</Link>
        </div>
      </section>
    </main>
  );
}
