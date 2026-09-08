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
import { StorefrontFooter, StorefrontMark } from "../../storefront-chrome";
import styles from "../../lineup.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [status, setStatus] = useState<string | null>(null);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicVariant | null>(null);

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
                        onClick={() => setSelected(variant)}
                      >
                        {variantLabel(variant)}
                      </button>
                    );
                  })}
                </div>

                {selected && (
                  <p className={styles.selectedVariant}>
                    {variantLabel(selected)} — R{selected.price} — {selected.stock} in stock
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      <StorefrontFooter status={status} />
    </div>
  );
}
