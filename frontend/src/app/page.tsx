"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPublicProducts, priceLabel, type PublicProduct } from "@/lib/storefront";
import { StorefrontFooter, StorefrontMark } from "./storefront-chrome";
import styles from "./lineup.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  const [status, setStatus] = useState<string | null>(null);
  const [products, setProducts] = useState<PublicProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  useEffect(() => {
    listPublicProducts()
      .then(setProducts)
      .catch(() => setError("Couldn't load products."));
  }, []);

  return (
    <div className={styles.page}>
      <StorefrontMark />

      <div className={styles.sheet}>
        <h1 className={styles.headline}>
          Purpose
          <span className={styles.over}>Over</span>
          Pressure
        </h1>
        <p className={styles.tagline}>
          This year&rsquo;s camp drop. He has a plan &amp; I have a purpose.
        </p>
        <p className={styles.verse}>
          So we are convinced that every detail of our lives is continually woven together for
          good, for we are his lovers who have been called to fulfill his designed purpose.
          <span className={styles.verseRef}>Romans 8:28</span>
        </p>

        {error && <p className={styles.error}>{error}</p>}
        {!error && !products && <p className={styles.tagline}>Loading…</p>}

        {products && products.length > 0 && (
          <section className={styles.gallery}>
            {products.map((product) => (
              <Link
                href={`/products/${product.id}`}
                className={styles.galleryItem}
                key={product.id}
              >
                <span className={styles.gallerySpray} aria-hidden="true" />
                <div className={styles.galleryFrame}>
                  {product.photo_url ? (
                    <img
                      src={product.photo_url}
                      alt={`${product.name} — Purpose Over Pressure design`}
                      loading="lazy"
                      className={styles.galleryImg}
                    />
                  ) : (
                    <div className={styles.galleryPlaceholder}>No photo yet</div>
                  )}
                </div>
                <span className={styles.galleryTag}>{product.name}</span>
                <span className={styles.galleryPrice}>{priceLabel(product.variants)}</span>
              </Link>
            ))}
          </section>
        )}

        {products && products.length === 0 && (
          <p className={styles.tagline}>No products available yet — check back soon.</p>
        )}

        <div className={styles.notice}>
          <p className={styles.noticeTitle}>How to pay &amp; collect</p>
          <p>
            Pay by EFT after ordering — bank details and your order reference will show at
            checkout. Pickup at camp only; no shipping.
          </p>
        </div>
      </div>

      <StorefrontFooter status={status} />
    </div>
  );
}
