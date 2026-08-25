"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./EntityQuickView.module.css";

export type QuickViewDetail = {
  label: string;
  value: string | number | null | undefined;
};

type Props = {
  kind: "person" | "garment" | "outfit";
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  details?: QuickViewDetail[];
  href: string;
  fullLabel: string;
  children: ReactNode;
  inline?: boolean;
  ariaLabel?: string;
};

export function EntityQuickView({
  kind,
  title,
  subtitle,
  imageUrl,
  description,
  details = [],
  href,
  fullLabel,
  children,
  inline = false,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);

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

  const visibleDetails = details.filter((detail) => detail.value !== null && detail.value !== undefined && detail.value !== "");
  const fallback = title.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "LS";

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger}${inline ? ` ${styles.triggerInline}` : ""}`}
        aria-label={ariaLabel ?? `Quick view ${title}`}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${title} quick view`} onClick={() => setOpen(false)}>
          <section className={styles.card} onClick={(event) => event.stopPropagation()}>
            <button className={styles.close} type="button" aria-label="Close quick view" onClick={() => setOpen(false)}>×</button>
            <div className={styles.identity}>
              {imageUrl ? (
                <img className={`${styles.image}${kind === "person" ? ` ${styles.personImage}` : ""}`} src={imageUrl} alt="" />
              ) : (
                <div className={`${styles.fallback}${kind === "person" ? ` ${styles.personFallback}` : ""}`}>{fallback}</div>
              )}
              <div>
                <span className={styles.kicker}>{kind}</span>
                <h2 className={styles.title}>{title}</h2>
                {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
              </div>
            </div>
            {description ? <p className={styles.description}>{description}</p> : null}
            {visibleDetails.length ? (
              <div className={styles.stats}>
                {visibleDetails.map((detail) => (
                  <div className={styles.stat} key={detail.label}>
                    <strong>{detail.value}</strong>
                    <span>{detail.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <Link className={styles.full} href={href}>{fullLabel}</Link>
          </section>
        </div>
      ) : null}
    </>
  );
}
