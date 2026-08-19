import Link from "next/link";

export function Header() {
  return (
    <header className="header">
      <Link className="brand" href="/">
        <span className="brandMark">LS</span>
        <span>LikeSized</span>
      </Link>
      <nav>
        <Link href="/people">People my size</Link>
        <Link href="/closet">Closet</Link>
        <Link className="navButton" href="/onboarding">Fit profile</Link>
      </nav>
    </header>
  );
}
