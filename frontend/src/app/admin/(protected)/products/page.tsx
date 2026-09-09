"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CatalogError, listProducts, type Product } from "@/lib/catalog";
import styles from "../../admin.module.css";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((err) =>
        setError(err instanceof CatalogError ? err.message : "Couldn't load products."),
      );
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Products</h1>
        <Link href="/admin/products/new" className={styles.linkButton}>
          New product
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!error && !products && <p>Loading…</p>}

      {products && products.length === 0 && <p>No products yet.</p>}

      {products && products.length > 0 && (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Variants</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        product.active ? styles.badgeFilled : styles.badgeQuiet
                      }`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{product.variants.length}</td>
                  <td>
                    <Link href={`/admin/products/${product.id}`} className={styles.secondaryButton}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
