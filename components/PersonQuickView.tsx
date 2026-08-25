"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./EntityQuickView.module.css";

type Summary = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  overallMatch: number | null;
  topsMatch: number | null;
  bottomsMatch: number | null;
  totalGarments: number | null;
  totalOutfits: number | null;
};

type Props = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  children: ReactNode;
  inline?: boolean;
};

export function PersonQuickView({ username, displayName, avatarUrl, children, inline = false }: Props) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const name = summary?.displayName?.trim() || displayName?.trim() || username;
  const photo = summary?.avatarUrl ?? avatarUrl ?? null;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function openQuickView() {
    setOpen(true);
    if (summary || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/people/${encodeURIComponent(username)}/quick-view`, { cache: "no-store" });
      if (response.ok) setSummary(await response.json() as Summary);
    } finally {
      setLoading(false);
    }
  }

  const stats = summary ? [
    ["Overall Match", summary.overallMatch === null ? "—" : `${summary.overallMatch}%`],
    ["Tops Match", summary.topsMatch === null ? "—" : `${summary.topsMatch}%`],
    ["Bottoms Match", summary.bottomsMatch === null ? "—" : `${summary.bottomsMatch}%`],
    ["Total Garments", summary.totalGarments ?? "—"],
    ["Total Outfits", summary.totalOutfits ?? "—"],
  ] as const : [];

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger}${inline ? ` ${styles.triggerInline}` : ""}`}
        aria-label={`Quick view ${name}`}
        onClick={() => void openQuickView()}
      >
        {children}
      </button>
      {open ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${name} profile quick view`} onClick={() => setOpen(false)}>
          <section className={styles.card} onClick={(event) => event.stopPropagation()}>
            <button className={styles.close} type="button" aria-label="Close profile quick view" onClick={() => setOpen(false)}>×</button>
            <div className={styles.identity}>
              {photo ? <img className={`${styles.image} ${styles.personImage}`} src={photo} alt="" /> : <div className={`${styles.fallback} ${styles.personFallback}`}>{name.slice(0, 1).toUpperCase()}</div>}
              <div>
                <span className={styles.kicker}>person</span>
                <h2 className={styles.title}>{name}</h2>
                <span className={styles.subtitle}>@{username}</span>
              </div>
            </div>
            {loading ? <p className={styles.loading}>Loading profile details…</p> : null}
            {stats.length ? (
              <div className={styles.stats}>
                {stats.map(([label, value]) => <div className={styles.stat} key={label}><strong>{value}</strong><span>{label}</span></div>)}
              </div>
            ) : null}
            <Link className={styles.full} href={`/people/${username}`}>View Full Profile</Link>
          </section>
        </div>
      ) : null}
    </>
  );
}
