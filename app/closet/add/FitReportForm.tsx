"use client";

import { type ReactNode, useRef, useState } from "react";
import styles from "./fitReport.module.css";

type ServerAction = (formData: FormData) => void | Promise<void>;
type ReviewRow = { label: string; value: string };

function clearInvalidState(form: HTMLFormElement) {
  form.querySelectorAll(".fieldInvalid").forEach((node) => node.classList.remove("fieldInvalid"));
  form.querySelectorAll(".fieldOptionalInvalid").forEach((node) => node.classList.remove("fieldOptionalInvalid"));
  form.querySelectorAll<HTMLElement>("[aria-invalid='true']").forEach((node) => node.removeAttribute("aria-invalid"));
}

function clearFieldInvalidState(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  field.removeAttribute("aria-invalid");
  const label = field.closest("label");
  label?.classList.remove("fieldInvalid");
  label?.classList.remove("fieldOptionalInvalid");
}

function showInvalidState(form: HTMLFormElement, scroll: boolean) {
  clearInvalidState(form);
  const invalid = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input:invalid, select:invalid, textarea:invalid"));
  for (const field of invalid) {
    field.setAttribute("aria-invalid", "true");
    const label = field.closest("label");
    label?.classList.add("fieldInvalid");
    if (!field.required) label?.classList.add("fieldOptionalInvalid");
  }
  const summary = form.querySelector<HTMLElement>("[data-validation-summary]");
  if (summary) summary.hidden = invalid.length === 0;
  if (scroll && invalid[0]) {
    invalid[0].scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => invalid[0]?.focus({ preventScroll: true }), 250);
  }
}

function normalizeRetailLink(form: HTMLFormElement) {
  const field = form.elements.namedItem("product_url");
  if (!(field instanceof HTMLInputElement)) return;
  const value = field.value.trim();
  if (!value) return;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) field.value = `https://${value}`;
}

function validateBarcodeField(field: HTMLInputElement) {
  const value = field.value.trim();
  if (!value) {
    field.setCustomValidity("");
    return;
  }
  const digits = value.replace(/\D/g, "");
  field.setCustomValidity(/^\d{6,32}$/.test(digits) ? "" : "Fix this barcode or clear it to continue.");
}

function validateBarcodeFields(form: HTMLFormElement) {
  for (const name of ["upc", "identity_issue_barcode"]) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement) validateBarcodeField(field);
  }
}

function reviewValue(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (field instanceof HTMLInputElement && field.type === "file") return field.files?.length ? "Added" : "";
  if (field instanceof HTMLSelectElement) {
    if (!field.value) return "";
    return field.selectedOptions[0]?.textContent?.trim() ?? field.value;
  }
  return field.value.trim();
}

function collectReviewRows(form: HTMLFormElement): ReviewRow[] {
  const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-review-label], input[name='size_normalized_label']"));
  return fields.flatMap((field) => {
    const value = reviewValue(field);
    if (!value) return [];
    const label = field.name === "size_normalized_label"
      ? "Size"
      : field.dataset.reviewLabel?.trim() ?? "";
    return label ? [{ label, value }] : [];
  });
}

export function FitReportForm({ action, previewOnly = false, children }: { action?: ServerAction; previewOnly?: boolean; children: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);

  return <>
    <form
      ref={formRef}
      className={`garmentForm ${styles.form}`}
      action={action}
      noValidate
      onSubmit={(event) => {
        const form = event.currentTarget;
        normalizeRetailLink(form);
        validateBarcodeFields(form);
        if (!form.checkValidity()) {
          event.preventDefault();
          showInvalidState(form, true);
          return;
        }
        if (!confirmedRef.current) {
          event.preventDefault();
          setReviewRows(collectReviewRows(form));
          setReviewOpen(true);
        }
      }}
      onBlur={(event) => {
        const form = event.currentTarget;
        const target = event.target;
        if (target instanceof HTMLInputElement && target.name === "product_url") {
          normalizeRetailLink(form);
          if (target.validity.valid) clearFieldInvalidState(target);
        }
      }}
      onChange={(event) => {
        const form = event.currentTarget;
        const target = event.target;
        if (target instanceof HTMLInputElement && (target.name === "upc" || target.name === "identity_issue_barcode")) {
          validateBarcodeField(target);
        }
        if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
          if (target.validity.valid) clearFieldInvalidState(target);
        }
        if (!form.querySelector(":invalid")) {
          const summary = form.querySelector<HTMLElement>("[data-validation-summary]");
          if (summary) summary.hidden = true;
        }
      }}
    >
      <div className={styles.validationSummary} data-validation-summary hidden role="alert">
        Fix or clear the highlighted entries below. Everything else you entered has been kept.
      </div>
      {children}
    </form>

    {reviewOpen ? <div className={styles.reviewOverlay} role="dialog" aria-modal="true" aria-labelledby="fit-report-review-title">
      <div className={styles.reviewCard}>
        <span className="eyebrow">FINAL CHECK</span>
        <h2 id="fit-report-review-title">Does this look right?</h2>
        <p>Review the main Fit Report details before confirming.</p>
        <div className={styles.reviewRows}>
          {reviewRows.map((row, index) => <div className={styles.reviewRow} key={`${row.label}-${index}`}>
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>)}
        </div>
        {previewOnly ? <div className={styles.previewNote}>Preview only — nothing will be saved.</div> : null}
        <div className={styles.reviewActions}>
          <button className="secondaryButton" type="button" onClick={() => setReviewOpen(false)}>← Go Back & Edit</button>
          <button className="primaryButton" type="button" onClick={() => {
            if (previewOnly) {
              setReviewOpen(false);
              return;
            }
            confirmedRef.current = true;
            setReviewOpen(false);
            formRef.current?.requestSubmit();
          }}>{previewOnly ? "Looks right — preview only" : "Confirm Fit Report →"}</button>
        </div>
      </div>
    </div> : null}
  </>;
}
