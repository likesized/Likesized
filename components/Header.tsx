import Link from "next/link";
import { MemberMenu } from "@/components/MemberMenu";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const signedIn = !error && Boolean(claimsData?.claims?.sub);
  let unreadCount = 0;
  let isAdmin = false;

  if (signedIn) {
    const [{ data }, { data: adminData }, { count: evidenceAlertCount }] = await Promise.all([
      supabase.rpc("get_fit_twin_notification_unread_count"),
      supabase.rpc("is_current_user_admin"),
      supabase
        .from("product_evidence_notifications")
        .select("product_id", { count: "exact", head: true })
        .not("last_notified_at", "is", null)
        .is("read_at", null),
    ]);
    unreadCount = (typeof data === "number" ? data : Number(data ?? 0)) + (evidenceAlertCount ?? 0);
    isAdmin = Boolean(adminData);
  }

  return (
    <header className="header">
      <Link className="brand" href="/" aria-label="LikeSized home">
        <img className="brandLogo" src="/brand/likesized-logo.png" alt="LikeSized" width="2048" height="682" />
      </Link>
      {signedIn ? (
        <MemberMenu unreadCount={unreadCount} isAdmin={isAdmin} />
      ) : (
        <nav aria-label="Primary navigation">
          <Link className="navButton" href="/login">My Fit Profile</Link>
        </nav>
      )}
    </header>
  );
}
