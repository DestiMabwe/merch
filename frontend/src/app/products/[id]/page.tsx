"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getPublicProduct,
  groupVariantsByColor,
  priceLabel,
  variantLabel,
  type PublicProduct,
  type PublicVariant,
} from "@/lib/storefront";
import { CartLink, StorefrontFooter, StorefrontMark } from "../../storefront-chrome";
import { useCart } from "@/lib/cart-context";
import styles from "../../lineup.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { items: cartItems, addItem } = useCart();
  const [status, setStatus] = useState<string | null>(null);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  useEffect(() => {
    params
      .then(({ id }) => getPublicProduct(Number(id)))
      .then(setProduct)
      .catch(() => setError("Product not found."));
  }, [params]);

  return (
    <div className={styles.page}>
      <CartLink />
      <StorefrontMark />

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}

      <div className={styles.sheet}>
        <Link href="/" className={styles.backLink}>
          ← Back to store
        </Link>

        {error && <p className={styles.error}>{error}</p>}
        {!error && !product && <p className={styles.tagline}>Loading…</p>}

        {product && (
          <>
            <h1 className={styles.headline}>{product.name}</h1>

            <section className={styles.gallery}>
              <div className={`${styles.galleryItem} ${styles["galleryItem--flat"]}`}>
                <span className={styles.gallerySpray} aria-hidden="true" />
                <div className={styles.galleryFrame}>
                  {product.photo_url ? (
                    <img
                      src={product.photo_url}
                      alt={`${product.name} — Purpose Over Pressure design`}
                      className={styles.galleryImg}
                    />
                  ) : (
                    <div className={styles.galleryPlaceholder}>No photo yet</div>
                  )}
                </div>
                <span className={styles.galleryTag}>{priceLabel(product.variants)}</span>
              </div>
            </section>

            {product.description && <p className={styles.tagline}>{product.description}</p>}

            <div className={styles.purchasePanel}>
              {product.variants.length === 0 ? (
                <p className={styles.panelNote}>No sizes currently available.</p>
              ) : (
                <>
                  {groupVariantsByColor(product.variants).map((group) => (
                    <div className={styles.variantGroup} key={group.color}>
                      <span className={styles.checkoutLabel}>{group.color}</span>
                      <div className={styles.sizeRow}>
                        {group.variants.map((variant) => {
                          const isSoldOut = variant.stock === 0;
                          const isSelected = selected?.id === variant.id;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              className={`${styles.sizeChip} ${
                                isSoldOut ? styles["sizeChip--soldOut"] : ""
                              } ${isSelected ? styles["sizeChip--selected"] : ""}`}
                              disabled={isSoldOut}
                              aria-pressed={isSelected}
                              onClick={() => {
                                setSelected(variant);
                                setQuantity(1);
                              }}
                            >
                              {variant.size ?? variantLabel(variant)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selected && (() => {
                    const alreadyInCart =
                      cartItems.find((item) => item.variantId === selected.id)?.quantity ?? 0;
                    const remaining = Math.max(selected.stock - alreadyInCart, 0);
                    return (
                      <div className={styles.purchaseAction}>
                        <p className={styles.selectedVariant}>
                          {variantLabel(selected)} — R{selected.price} — {selected.stock} in stock
                        </p>

                        {remaining > 0 ? (
                          <div className={styles.addToCartRow}>
                            <div className={styles.stepper}>
                              <button
                                type="button"
                                className={styles.stepperButton}
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={remaining}
                                value={quantity}
                                aria-label="Quantity"
                                className={styles.stepperInput}
                                onChange={(event) => {
                                  const next = Number(event.target.value);
                                  setQuantity(Math.min(Math.max(next || 1, 1), remaining));
                                }}
                              />
                              <button
                                type="button"
                                className={styles.stepperButton}
                                onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
                                disabled={quantity >= remaining}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className={styles.addToCartButton}
                              onClick={() => {
                                addItem(
                                  {
                                    productId: product.id,
                                    productName: product.name,
                                    variantId: selected.id,
                                    size: selected.size,
                                    color: selected.color,
                                    price: selected.price,
                                    stock: selected.stock,
                                  },
                                  quantity,
                                );
                                showToast(
                                  `Added ${quantity} × ${variantLabel(selected)} to cart`,
                                );
                              }}
                            >
                              Add to Cart
                            </button>
                          </div>
                        ) : (
                          <p className={styles.panelNote}>
                            All {alreadyInCart} in stock are already in your cart.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <StorefrontFooter status={status} />
    </div>
  );
}
