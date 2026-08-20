import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="authShell">
      <section className="authCard">
        <span className="eyebrow">ONE MORE STEP</span>
        <h1>Check your email.</h1>
        <p>We sent you the next step.</p>
        <Link className="secondaryButton" href="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
