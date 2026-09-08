"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CheckoutError, submitCheckout, type Order } from "@/lib/orders";
import { OrderPaymentDetails } from "../banking-details";
import { StorefrontFooter, StorefrontMark } from "../storefront-chrome";
import styles from "../lineup.module.css";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() && !phone.trim()) {
      setError("Provide an email or phone number so we can reach you about your order.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitCheckout(name, email, phone, items);
      setOrder(result);
      clear();
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
          <p className={styles.tagline}>
            Thanks, {order.customer_name}. Your order reference is{" "}
            <strong>{order.reference}</strong>.
          </p>

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

          <OrderPaymentDetails reference={order.reference} />

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

        {items.length === 0 ? (
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

            <form className={styles.checkoutForm} onSubmit={handleSubmit}>
              <label className={styles.checkoutField}>
                <span className={styles.checkoutLabel}>Name</span>
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

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.addToCartButton} disabled={submitting}>
                {submitting ? "Placing order…" : "Place Order"}
              </button>
            </form>
          </>
        )}
      </div>
      <StorefrontFooter status={null} />
    </div>
  );
}
