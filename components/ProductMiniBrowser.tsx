"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./ProductMiniBrowser.module.css";

export function ProductMiniBrowser({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <button
        className={styles.trigger}
        type="button"
        aria-label={`Open ${label}`}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open ? (
        <div className={styles.browser} role="dialog" aria-modal="true" aria-label={label}>
          <header>
            <button
              type="button"
              onClick={() => frame.current?.contentWindow?.history.back()}
              aria-label="Go back in product browser"
            >
              ← Back
            </button>
            <strong>{label}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close product browser">
              ×
            </button>
          </header>
          <iframe ref={frame} src={href} title={label} />
        </div>
      ) : null}
    </>
  );
}
