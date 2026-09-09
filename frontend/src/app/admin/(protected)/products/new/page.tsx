"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CatalogError, createProduct, type VariantInput } from "@/lib/catalog";
import styles from "../../../admin.module.css";

type DraftVariant = VariantInput & { key: number };

let nextKey = 1;

function emptyVariant(): DraftVariant {
  return { key: nextKey++, size: "", color: "", price: 0, stock: 0 };
}

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<DraftVariant[]>([emptyVariant()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateVariant(key: number, field: keyof VariantInput, value: string) {
    setVariants((rows) =>
      rows.map((row) => {
        if (row.key !== key) return row;
        if (field === "price" || field === "stock") {
          return { ...row, [field]: Number(value) || 0 };
        }
        return { ...row, [field]: value || null };
      }),
    );
  }

  function addVariant() {
    setVariants((rows) => [...rows, emptyVariant()]);
  }

  function removeVariant(key: number) {
    setVariants((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const product = await createProduct({
        name,
        description: description || null,
        variants: variants.map(({ size, color, price, stock }) => ({ size, color, price, stock })),
      });
      router.push(`/admin/products/${product.id}`);
    } catch (err) {
      setError(err instanceof CatalogError ? err.message : "Couldn't create the product.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/admin/products" className={styles.backLink}>
        ← Products
      </Link>
      <h1 className={styles.title}>New Product</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            required
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={styles.input}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Variants</h2>
          {variants.map((row) => (
            <div className={styles.variantRow} key={row.key}>
              <input
                className={styles.variantInput}
                placeholder="Size"
                value={row.size ?? ""}
                onChange={(e) => updateVariant(row.key, "size", e.target.value)}
              />
              <input
                className={styles.variantInput}
                placeholder="Color"
                value={row.color ?? ""}
                onChange={(e) => updateVariant(row.key, "color", e.target.value)}
              />
              <input
                className={styles.variantInput}
                type="number"
                placeholder="Price"
                value={row.price}
                onChange={(e) => updateVariant(row.key, "price", e.target.value)}
              />
              <input
                className={styles.variantInput}
                type="number"
                placeholder="Stock"
                value={row.stock}
                onChange={(e) => updateVariant(row.key, "stock", e.target.value)}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => removeVariant(row.key)}
                disabled={variants.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className={styles.secondaryButton} onClick={addVariant}>
            Add variant
          </button>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Creating…" : "Create product"}
        </button>
      </form>
    </div>
  );
}
