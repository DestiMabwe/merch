"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import styles from "./order-timeline.module.css";

const STAGES = [
  { key: "pending_payment", label: "Ordered" },
  { key: "paid", label: "Paid" },
  { key: "ready_for_collection", label: "Ready for Collection" },
  { key: "collected", label: "Collected" },
] as const;

export function OrderNumber({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    copyText(reference).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={styles.orderNumber}>
      <span className={styles.orderNumberLabel}>Order Number</span>
      <div className={styles.orderNumberRow}>
        <span className={styles.orderNumberValue}>{reference}</span>
        <button type="button" className={styles.copyButton} onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className={styles.orderNumberHint}>
        Save this — you&rsquo;ll need it to track your order status.
      </p>
    </div>
  );
}

export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return <p className={styles.cancelledNote}>This order was cancelled.</p>;
  }

  const currentIndex = STAGES.findIndex((stage) => stage.key === status);

  return (
    <ol className={styles.timeline}>
      {STAGES.map((stage, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        return (
          <li key={stage.key} className={`${styles.stage} ${styles[`stage--${state}`] ?? ""}`}>
            <span className={styles.stageMarker} aria-hidden="true" />
            <span className={styles.stageLabel}>{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
