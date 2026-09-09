"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  lookupOrder,
  OrderLookupError,
  statusLabel,
  uploadProofOfPayment,
  type Order,
} from "@/lib/orders";
import { OrderTimeline } from "../order-timeline";
import { StorefrontFooter, StorefrontMark } from "../storefront-chrome";
import styles from "../lineup.module.css";

export default function OrderLookupPage() {
  const [reference, setReference] = useState("");
  const [name, setName] = useState("");
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setOrder(null);

    setLooking(true);
    try {
      setOrder(await lookupOrder(reference, name));
    } catch (err) {
      setError(err instanceof OrderLookupError ? err.message : "Couldn't look up that order.");
    } finally {
      setLooking(false);
    }
  }

  async function handleUploadProof() {
    if (!order || !proofFile) return;
    setUploadError(null);
    setUploading(true);
    try {
      setOrder(await uploadProofOfPayment(order.reference, name, proofFile));
      setProofFile(null);
    } catch (err) {
      setUploadError(
        err instanceof OrderLookupError ? err.message : "Couldn't upload your proof of payment.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.page}>
      <StorefrontMark />
      <div className={styles.sheet}>
        <Link href="/" className={styles.backLink}>
          ← Back to store
        </Link>

        <h1 className={styles.headline}>Track Your Order</h1>
        <p className={styles.tagline}>Enter your order number and the name you checked out with.</p>

        <form className={styles.checkoutForm} onSubmit={handleLookup}>
          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>Order Number</span>
            <input
              type="text"
              required
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className={styles.checkoutInput}
              placeholder="CM-XXXXXX"
            />
          </label>
          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>Name and Surname</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={styles.checkoutInput}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.addToCartButton} disabled={looking}>
            {looking ? "Looking up…" : "Find My Order"}
          </button>
        </form>

        {order && (
          <div className={styles.notice}>
            <p className={styles.noticeTitle}>
              {order.reference} — {statusLabel(order.status)}
            </p>

            <OrderTimeline status={order.status} />

            <ul className={styles.cartList}>
              {order.items.map((item, index) => (
                <li className={styles.cartRow} key={index}>
                  <div className={styles.cartRowInfo}>
                    <span className={styles.cartRowName}>{item.product_name}</span>
                    <span className={styles.cartRowVariant}>
                      {[item.variant_size, item.variant_color].filter(Boolean).join(" / ") ||
                        "One size"}{" "}
                      × {item.quantity}
                    </span>
                  </div>
                  <span className={styles.cartRowLineTotal}>
                    R{item.unit_price * item.quantity}
                  </span>
                </li>
              ))}
            </ul>
            <div className={styles.cartSubtotal}>Total: R{order.total}</div>

            {order.status === "cancelled" ? null : order.proof_of_payment_url ? (
              <p className={styles.checkoutHint}>Proof of payment on file. Thank you!</p>
            ) : (
              <div className={styles.checkoutField}>
                <span className={styles.checkoutLabel}>Upload Proof of Payment</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className={styles.addToCartButton}
                  onClick={handleUploadProof}
                  disabled={!proofFile || uploading}
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
                {uploadError && <p className={styles.error}>{uploadError}</p>}
              </div>
            )}
          </div>
        )}
      </div>
      <StorefrontFooter status={null} />
    </div>
  );
}
