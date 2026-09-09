"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import styles from "./banking-details.module.css";

const BANK_FIELDS = [
  { key: "bank", label: "Bank", value: "Capitec" },
  { key: "accountType", label: "Account Type", value: "Savings Account" },
  { key: "accountNumber", label: "Account Number", value: "2467898187", copyable: true },
  { key: "branchCode", label: "Branch Code", value: "470010" },
];

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
            {field.copyable && (
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => onCopy(field.key, field.value)}
              >
                {copiedKey === field.key ? "Copied!" : "Copy"}
              </button>
            )}
          </dd>
        </div>
      ))}
    </>
  );
}

export function BankingDetails() {
  const { copiedKey, handleCopy } = useCopyField();

  return (
    <div className={styles.notice}>
      <p className={styles.noticeTitle}>🏦 Banking Details</p>
      <p className={styles.noticeSub}>
        Pay by EFT after ordering. Collect from Forward In Faith Ministries Int., 7 Spencer Road, Maitland; no shipping.
      </p>

      <dl className={styles.fieldList}>
        <BankAccountFields copiedKey={copiedKey} onCopy={handleCopy} />

        <div className={styles.field}>
          <dt className={styles.fieldLabel}>Reference</dt>
          <dd className={styles.fieldValue}>
            <span>Your Name + &ldquo;Merch&rdquo;</span>
          </dd>
          <p className={styles.fieldHint}>
            Banks require a reference for EFT payments — write your name followed by
            &ldquo;Merch&rdquo; (e.g. &ldquo;Jane Smith Merch&rdquo;) so we can match your
            payment to you.
          </p>
        </div>
      </dl>

      <p className={styles.footnote}>
        An order number for tracking becomes available once you complete checkout.
      </p>
    </div>
  );
}

export function OrderPaymentDetails({ customerName }: { customerName: string }) {
  const { copiedKey, handleCopy } = useCopyField();
  const paymentReference = `${customerName} Merch`;

  return (
    <div className={styles.notice}>
      <p className={styles.noticeTitle}>🏦 Banking Details</p>
      <p className={styles.noticeSub}>
        Pay by EFT using the details below. Collect from Forward In Faith Ministries Int., 7 Spencer Road, Maitland; no shipping.
      </p>

      <dl className={styles.fieldList}>
        <BankAccountFields copiedKey={copiedKey} onCopy={handleCopy} />

        <div className={styles.field}>
          <dt className={styles.fieldLabel}>Reference</dt>
          <dd className={styles.fieldValue}>
            <span>{paymentReference}</span>
          </dd>
          <p className={styles.fieldHint}>
            Use <strong>&ldquo;{paymentReference}&rdquo;</strong> as your payment reference so we
            can match your EFT to you.
          </p>
        </div>
      </dl>
    </div>
  );
}
