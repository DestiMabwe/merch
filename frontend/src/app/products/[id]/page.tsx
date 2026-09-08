"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPublicProduct,
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
  const [added, setAdded] = useState(false);

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

            {product.variants.length === 0 ? (
              <p className={styles.tagline}>No sizes currently available.</p>
            ) : (
              <>
                <div className={styles.sizeRow}>
                  {product.variants.map((variant) => {
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
                          setAdded(false);
                        }}
                      >
                        {variantLabel(variant)}
                      </button>
                    );
                  })}
                </div>

                {selected && (() => {
                  const alreadyInCart =
                    cartItems.find((item) => item.variantId === selected.id)?.quantity ?? 0;
                  const remaining = Math.max(selected.stock - alreadyInCart, 0);
                  return (
                    <>
                      <p className={styles.selectedVariant}>
                        {variantLabel(selected)} — R{selected.price} — {selected.stock} in stock
                      </p>

                      {remaining > 0 ? (
                        <div className={styles.addToCartRow}>
                          <input
                            type="number"
                            min={1}
                            max={remaining}
                            value={quantity}
                            aria-label="Quantity"
                            className={styles.quantityInput}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              setQuantity(Math.min(Math.max(next || 1, 1), remaining));
                              setAdded(false);
                            }}
                          />
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
                              setAdded(true);
                            }}
                          >
                            Add to Cart
                          </button>
                          {added && (
                            <Link href="/cart" className={styles.backLink}>
                              Added — view cart →
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className={styles.tagline}>
                          All {alreadyInCart} in stock are already in your cart.
                        </p>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}
      </div>

      <StorefrontFooter status={status} />
    </div>
  );
}
