import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/HeaderResponsive.module.css";

export async function Header() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const signedIn = !error && Boolean(claimsData?.claims?.sub);
  let unreadCount = 0;

  if (signedIn) {
    const { data } = await supabase.rpc("get_fit_twin_notification_unread_count");
    unreadCount = typeof data === "number" ? data : Number(data ?? 0);
  }

  return (
    <header className="header">
      <Link className="brand" href="/" aria-label="LikeSized home">
        <img
          className="brandLogo"
          src="/brand/likesized-logo.png"
          alt="LikeSized"
          width="2048"
          height="682"
        />
      </Link>

      {signedIn ? (
        <>
          <nav className={styles.signedInDesktop} aria-label="Primary navigation">
            <Link href="/search">Search</Link>
            <Link href="/people">People my size</Link>
            <Link href="/twins">Fit twins</Link>
            <Link href="/following">Following</Link>
            <Link href="/outfits">Outfits</Link>
            <Link href="/closet">Closet</Link>
            <Link href="/settings">Settings</Link>
            <Link className="navButton" href="/notifications">Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</Link>
            <Link className="navButton" href="/onboarding">Fit profile</Link>
            <form action="/auth/signout" method="post">
              <button className="navTextButton" type="submit">Sign out</button>
            </form>
          </nav>

          <div className={styles.mobileNav}>
            <details className={styles.mobileMenu}>
              <summary>Menu</summary>
              <div className={styles.mobileMenuPanel} role="navigation" aria-label="Mobile navigation">
                <Link href="/onboarding">Fit Profile</Link>
                <Link href="/notifications">Notifications{unreadCount > 0 ? <span className={styles.notificationCount}>{unreadCount}</span> : null}</Link>
                <Link href="/search">Search</Link>
                <Link href="/people">People My Size</Link>
                <Link href="/twins">Fit Twins</Link>
                <Link href="/following">Following</Link>
                <Link href="/outfits">Outfits</Link>
                <Link href="/closet">Closet</Link>
                <Link href="/settings">Settings</Link>
                <form action="/auth/signout" method="post">
                  <button type="submit">Sign out</button>
                </form>
              </div>
            </details>
          </div>
        </>
      ) : (
        <nav aria-label="Primary navigation">
          <Link className="navButton" href="/login">My Fit Profile</Link>
        </nav>
      )}
    </header>
  );
}
