import Link from "next/link";

export default function HelpPage() {
  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">ACCOUNT</span>
        <h1>Help / FAQ</h1>
        <p>LikeSized help and fit-matching explanations will live here.</p>
      </div>

      <div className="emptyState">
        <span className="eyebrow">QUICK LINKS</span>
        <h2>Need to get somewhere?</h2>
        <p>Use the core LikeSized surfaces while the full FAQ is completed.</p>
        <div className="buttonRow">
          <Link className="secondaryButton" href="/onboarding">Fit Profile</Link>
          <Link className="secondaryButton" href="/people">People My Size</Link>
          <Link className="secondaryButton" href="/closet">My Closet</Link>
          <Link className="secondaryButton" href="/settings">Settings</Link>
        </div>
      </div>
    </main>
  );
}
