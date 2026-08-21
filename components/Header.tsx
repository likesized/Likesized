import Link from "next/link";
import { MobileMenu } from "@/components/MobileMenu";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/HeaderResponsive.module.css";

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      className={styles.notificationBell}
      href="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      title="Notifications"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
      {unreadCount > 0 ? <span className={styles.notificationBadge}>{unreadCount}</span> : null}
    </Link>
  );
}

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
        <img className="brandLogo" src="/brand/likesized-logo.png" alt="LikeSized" width="2048" height="682" />
      </Link>

      {signedIn ? (
        <>
          <nav className={styles.signedInDesktop} aria-label="Primary navigation">
            <details className={styles.desktopMenu}>
              <summary>Discover</summary>
              <div className={styles.desktopMenuPanel}>
                <Link href="/browse">Browse</Link>
                <Link href="/people">People My Size</Link>
                <Link href="/twins">Fit Twins</Link>
                <Link href="/following">Following</Link>
                <Link href="/outfits">Outfits</Link>
                <Link href="/likelocker">LikeLocker</Link>
              </div>
            </details>

            <details className={styles.desktopMenu}>
              <summary>My Closet</summary>
              <div className={styles.desktopMenuPanel}>
                <Link href="/closet">My Closet</Link>
                <Link href="/closet/add">New Fit Report</Link>
                <Link href="/outfits/new">New Outfit</Link>
              </div>
            </details>

            <NotificationBell unreadCount={unreadCount} />

            <details className={styles.desktopMenu}>
              <summary>Account</summary>
              <div className={styles.desktopMenuPanel}>
                <Link href="/onboarding">Fit Profile</Link>
                <Link href="/settings">Settings</Link>
                <Link href="/#faq">Help / FAQ</Link>
                <form action="/auth/signout" method="post">
                  <button type="submit">Sign Out</button>
                </form>
              </div>
            </details>
          </nav>
          <MobileMenu unreadCount={unreadCount} />
        </>
      ) : (
        <nav aria-label="Primary navigation">
          <Link className="navButton" href="/login">My Fit Profile</Link>
        </nav>
      )}
    </header>
  );
}
