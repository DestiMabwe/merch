"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { StorefrontFooter, StorefrontMark } from "../storefront-chrome";
import styles from "../lineup.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function variantLabel(size: string | null, color: string | null): string {
  return [size, color].filter(Boolean).join(" / ") || "One size";
}

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <div className={styles.page}>
      <StorefrontMark />

      <div className={styles.sheet}>
        <Link href="/" className={styles.backLink}>
          ← Back to store
        </Link>

        <h1 className={styles.headline}>Your Cart</h1>

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
                      {variantLabel(item.size, item.color)} — R{item.price}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    aria-label={`Quantity for ${item.productName}`}
                    className={styles.quantityInput}
                    onChange={(event) =>
                      setQuantity(item.variantId, Number(event.target.value) || 0)
                    }
                  />
                  <span className={styles.cartRowLineTotal}>R{item.price * item.quantity}</span>
                  <button
                    type="button"
                    className={styles.cartRemoveButton}
                    onClick={() => removeItem(item.variantId)}
                    aria-label={`Remove ${item.productName} from cart`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.cartSubtotal}>Subtotal: R{subtotal}</div>

            <Link href="/checkout" className={styles.addToCartButton}>
              Checkout
            </Link>
          </>
        )}
      </div>

      <StorefrontFooter status={status} />
    </div>
  );
}
