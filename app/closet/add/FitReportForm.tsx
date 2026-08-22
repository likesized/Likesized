"use client";

import type { ReactNode } from "react";
import styles from "./fitReport.module.css";

type ServerAction = (formData: FormData) => void | Promise<void>;

function clearInvalidState(form: HTMLFormElement) {
  form.querySelectorAll(".fieldInvalid").forEach((node) => node.classList.remove("fieldInvalid"));
  form.querySelectorAll<HTMLElement>("[aria-invalid='true']").forEach((node) => node.removeAttribute("aria-invalid"));
}

function showInvalidState(form: HTMLFormElement, scroll: boolean) {
  clearInvalidState(form);
  const invalid = Array.from(form.querySelectorAll<HTMLElement>("input:invalid, select:invalid, textarea:invalid"));
  for (const field of invalid) {
    field.setAttribute("aria-invalid", "true");
    field.closest("label")?.classList.add("fieldInvalid");
  }
  const summary = form.querySelector<HTMLElement>("[data-validation-summary]");
  if (summary) summary.hidden = invalid.length === 0;
  if (scroll && invalid[0]) {
    invalid[0].scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => invalid[0]?.focus({ preventScroll: true }), 250);
  }
}

export function FitReportForm({ action, children }: { action?: ServerAction; children: ReactNode }) {
  return <form
    className={`garmentForm ${styles.form}`}
    action={action}
    noValidate
    onSubmit={(event) => {
      const form = event.currentTarget;
      if (!form.checkValidity()) {
        event.preventDefault();
        showInvalidState(form, true);
      }
    }}
    onChange={(event) => {
      const form = event.currentTarget;
      const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (target.validity.valid) {
        target.removeAttribute("aria-invalid");
        target.closest("label")?.classList.remove("fieldInvalid");
      }
      if (!form.querySelector(":invalid")) {
        const summary = form.querySelector<HTMLElement>("[data-validation-summary]");
        if (summary) summary.hidden = true;
      }
    }}
  >
    <div className={styles.validationSummary} data-validation-summary hidden role="alert">
      Please complete the highlighted fields before submitting your Fit Report.
    </div>
    {children}
  </form>;
}
