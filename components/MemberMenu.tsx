"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "@/components/HeaderResponsive.module.css";

type MemberMenuProps = { unreadCount: number; isAdmin?: boolean };

export function MemberMenu({ unreadCount, isAdmin = false }: MemberMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  useEffect(() => { closeMenu(); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) closeMenu();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={styles.memberNav} ref={menuRef}>
      <Link className={styles.notificationBell} href="/notifications" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} title="Notifications">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
        {unreadCount > 0 ? <span className={styles.notificationBadge}>{unreadCount}</span> : null}
      </Link>
      <button type="button" className={styles.menuButton} aria-expanded={open} aria-controls="mobile-navigation-menu" onClick={() => setOpen((current) => !current)}>Menu</button>
      {open ? (
        <div id="mobile-navigation-menu" className={styles.menuPanel} role="navigation" aria-label="Member navigation">
          <div className={styles.sectionLabel}>Discover</div>
          <Link href="/explore" onClick={closeMenu}>Explore</Link>
          <Link href="/people" onClick={closeMenu}>People My Size</Link>
          <Link href="/circle" onClick={closeMenu}>My Circle</Link>
          <Link href="/likelocker" onClick={closeMenu}>LikeLocker</Link>

          <div className={styles.sectionLabel}>My Closet</div>
          <Link href="/closet" onClick={closeMenu}>My Closet</Link>
          <Link href="/closet/add" onClick={closeMenu}>New Fit Report</Link>
          <Link href="/outfits/new" onClick={closeMenu}>New Outfit</Link>

          <div className={styles.sectionLabel}>Account</div>
          <Link href="/onboarding" onClick={closeMenu}>Fit Profile</Link>
          <Link href="/settings" onClick={closeMenu}>Settings</Link>
          <Link href="/#faq" onClick={closeMenu}>Help / FAQ</Link>
          {isAdmin ? <Link href="/moderation" onClick={closeMenu}>Admin Moderation</Link> : null}
          <form action="/auth/signout" method="post" onSubmit={closeMenu}><button type="submit">Sign Out</button></form>
        </div>
      ) : null}
    </div>
  );
}
