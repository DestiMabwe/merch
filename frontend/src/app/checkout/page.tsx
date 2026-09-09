"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CheckoutError, submitCheckout, uploadProofOfPayment, type Order } from "@/lib/orders";
import { OrderPaymentDetails } from "../banking-details";
import { OrderNumber, OrderTimeline } from "../order-timeline";
import { StorefrontFooter, StorefrontMark } from "../storefront-chrome";
import styles from "../lineup.module.css";

export default function CheckoutPage() {
  const { items, subtotal, clear, hydrated } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [proofNote, setProofNote] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!hydrated || items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError("Provide an email or phone number so we can reach you about your order.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitCheckout(name, email, phone, items);
      clear();

      if (proofFile) {
        try {
          const withProof = await uploadProofOfPayment(result.reference, name, proofFile);
          setOrder(withProof);
        } catch {
          setOrder(result);
          setProofNote(
            "Your order was placed, but the proof of payment didn't upload — you can add it later from the order lookup page.",
          );
        }
      } else {
        setOrder(result);
      }
    } catch (err) {
      setError(err instanceof CheckoutError ? err.message : "Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className={styles.page}>
        <StorefrontMark />
        <div className={styles.sheet}>
          <h1 className={styles.headline}>Order Placed!</h1>
          <p className={styles.tagline}>Thanks, {order.customer_name}.</p>

          <OrderNumber reference={order.reference} />
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

          {order.proof_of_payment_url ? (
            <p className={styles.checkoutHint}>Proof of payment received — thank you!</p>
          ) : (
            proofNote && <p className={styles.error}>{proofNote}</p>
          )}

          <OrderPaymentDetails customerName={order.customer_name} />

          <Link href="/" className={styles.backLink}>
            ← Back to store
          </Link>
        </div>
        <StorefrontFooter status={null} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <StorefrontMark />
      <div className={styles.sheet}>
        <Link href="/cart" className={styles.backLink}>
          ← Back to cart
        </Link>

        <h1 className={styles.headline}>Checkout</h1>

        {!hydrated ? (
          <p className={styles.tagline}>Loading…</p>
        ) : items.length === 0 ? (
          <p className={styles.tagline}>
            Your cart is empty. <Link href="/">Go pick something out</Link>.
          </p>
        ) : (
          <>
            <ul className={styles.cartList}>
              {items.map((item) => (
                <li className={styles.cartRow} key={item.variantId}>
                  <div className={styles.cartRowInfo}>
                    <span className={styles.cartRowName}>{item.productName}</span>
                    <span className={styles.cartRowVariant}>
                      {[item.size, item.color].filter(Boolean).join(" / ") || "One size"} ×{" "}
                      {item.quantity}
                    </span>
                  </div>
                  <span className={styles.cartRowLineTotal}>R{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className={styles.cartSubtotal}>Subtotal: R{subtotal}</div>
          </>
        )}

        {/* Always mounted, independent of cart-loading state, so a click landed here
            before the cart finishes loading is never silently dropped. */}
        <form className={styles.checkoutForm} onSubmit={handleSubmit}>
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
          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={styles.checkoutInput}
            />
          </label>
          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={styles.checkoutInput}
            />
          </label>
          <p className={styles.checkoutHint}>Provide at least an email or a phone number.</p>

          <label className={styles.checkoutField}>
            <span className={styles.checkoutLabel}>Proof of Payment (optional)</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <p className={styles.checkoutHint}>
            Already paid? Attach a screenshot now, or add it later from the order lookup page.
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.addToCartButton}
            disabled={submitting || !hydrated || items.length === 0}
          >
            {submitting ? "Placing order…" : "Place Order"}
          </button>
        </form>
      </div>
      <StorefrontFooter status={null} />
    </div>
  );
}
