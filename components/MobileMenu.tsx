"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "@/components/HeaderResponsive.module.css";

type MobileMenuProps = {
  unreadCount: number;
};

export function MobileMenu({ unreadCount }: MobileMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={styles.mobileNav} ref={menuRef}>
      <button
        type="button"
        className={styles.mobileMenuButton}
        aria-expanded={open}
        aria-controls="mobile-navigation-menu"
        onClick={() => setOpen((current) => !current)}
      >
        Menu
      </button>

      {open ? (
        <div
          id="mobile-navigation-menu"
          className={styles.mobileMenuPanel}
          role="navigation"
          aria-label="Mobile navigation"
        >
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
      ) : null}
    </div>
  );
}
