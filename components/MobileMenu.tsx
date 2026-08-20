"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "@/components/HeaderResponsive.module.css";

type MobileMenuProps = {
  unreadCount: number;
};

export function MobileMenu({ unreadCount }: MobileMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <div className={styles.mobileNav}>
      <details className={styles.mobileMenu} ref={menuRef}>
        <summary>Menu</summary>
        <div className={styles.mobileMenuPanel} role="navigation" aria-label="Mobile navigation">
          <Link href="/onboarding" onClick={closeMenu}>Fit Profile</Link>
          <Link href="/notifications" onClick={closeMenu}>
            Notifications
            {unreadCount > 0 ? <span className={styles.notificationCount}>{unreadCount}</span> : null}
          </Link>
          <Link href="/search" onClick={closeMenu}>Search</Link>
          <Link href="/people" onClick={closeMenu}>People My Size</Link>
          <Link href="/twins" onClick={closeMenu}>Fit Twins</Link>
          <Link href="/following" onClick={closeMenu}>Following</Link>
          <Link href="/outfits" onClick={closeMenu}>Outfits</Link>
          <Link href="/closet" onClick={closeMenu}>Closet</Link>
          <Link href="/settings" onClick={closeMenu}>Settings</Link>
          <form action="/auth/signout" method="post" onSubmit={closeMenu}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </details>
    </div>
  );
}
