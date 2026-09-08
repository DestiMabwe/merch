"use client";

import { useState } from "react";
import styles from "./banking-details.module.css";

const BANK_FIELDS = [
  { key: "bank", label: "Bank", value: "Capitec" },
  { key: "accountType", label: "Account Type", value: "Savings Account" },
  { key: "accountNumber", label: "Account Number", value: "2467898187" },
  { key: "branchCode", label: "Branch Code", value: "470010" },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function useCopyField() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleCopy(key: string, value: string) {
    copyText(value).then((ok) => {
      if (!ok) return;
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
    });
  }

  return { copiedKey, handleCopy };
}

function BankAccountFields({
  copiedKey,
  onCopy,
}: {
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  return (
    <>
      {BANK_FIELDS.map((field) => (
        <div className={styles.field} key={field.key}>
          <dt className={styles.fieldLabel}>{field.label}</dt>
          <dd className={styles.fieldValue}>
            <span>{field.value}</span>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => onCopy(field.key, field.value)}
            >
              {copiedKey === field.key ? "Copied!" : "Copy"}
            </button>
          </dd>
        </div>
      ))}
    </>
  );
}

export function BankingDetails() {
  const [name, setName] = useState("");
  const { copiedKey, handleCopy } = useCopyField();

  const reference = `${name.trim() || "Your Name"} Merch`;

  return (
    <div className={styles.notice}>
      <p className={styles.noticeTitle}>🏦 Banking Details</p>
      <p className={styles.noticeSub}>
        Pay by EFT after ordering. Pickup at camp only; no shipping.
      </p>

      <dl className={styles.fieldList}>
        <BankAccountFields copiedKey={copiedKey} onCopy={handleCopy} />

        <div className={styles.field}>
          <dt className={styles.fieldLabel}>Reference</dt>
          <dd className={styles.fieldValue}>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your Name"
              aria-label="Your name, for the payment reference"
              className={styles.nameInput}
            />
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => handleCopy("reference", reference)}
            >
              {copiedKey === "reference" ? "Copied!" : "Copy"}
            </button>
          </dd>
          <p className={styles.fieldHint}>
            Type your name above, then copy <strong>&ldquo;{reference}&rdquo;</strong> as your
            payment reference so we can match your EFT to your order.
          </p>
        </div>
      </dl>
    </div>
  );
}

export function OrderPaymentDetails({ reference }: { reference: string }) {
  const { copiedKey, handleCopy } = useCopyField();

  return (
    <div className={styles.notice}>
      <p className={styles.noticeTitle}>🏦 Banking Details</p>
      <p className={styles.noticeSub}>
        Pay by EFT using the details below. Pickup at camp only; no shipping.
      </p>

      <dl className={styles.fieldList}>
        <BankAccountFields copiedKey={copiedKey} onCopy={handleCopy} />

        <div className={styles.field}>
          <dt className={styles.fieldLabel}>Reference</dt>
          <dd className={styles.fieldValue}>
            <span>{reference}</span>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => handleCopy("reference", reference)}
            >
              {copiedKey === "reference" ? "Copied!" : "Copy"}
            </button>
          </dd>
          <p className={styles.fieldHint}>
            Use <strong>&ldquo;{reference}&rdquo;</strong> as your payment reference so we can
            match your EFT to this order.
          </p>
        </div>
      </dl>
    </div>
  );
}
