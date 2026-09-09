"use client";

import { Fragment, use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CatalogError,
  createVariant,
  getProduct,
  updateProduct,
  updateVariant,
  uploadProductPhoto,
  type Product,
  type Variant,
  type VariantInput,
} from "@/lib/catalog";
import styles from "../../../admin.module.css";

function groupByColor(variants: Variant[]): { color: string; variants: Variant[] }[] {
  const groups: { color: string; variants: Variant[] }[] = [];
  for (const variant of variants) {
    const color = variant.color ?? "One color";
    const group = groups.find((g) => g.color === color);
    if (group) {
      group.variants.push(variant);
    } else {
      groups.push({ color, variants: [variant] });
    }
  }
  return groups;
}

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [newVariant, setNewVariant] = useState<VariantInput>({
    size: "",
    color: "",
    price: 0,
    stock: 0,
  });
  const [addingVariant, setAddingVariant] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);

  useEffect(() => {
    getProduct(productId)
      .then((p) => {
        setProduct(p);
        setName(p.name);
        setDescription(p.description ?? "");
        setActive(p.active);
      })
      .catch((err) =>
        setLoadError(err instanceof CatalogError ? err.message : "Couldn't load this product."),
      );
  }, [productId]);

  async function handleSaveDetails(e: FormEvent) {
    e.preventDefault();
    setDetailsError(null);
    setSavingDetails(true);
    try {
      const updated = await updateProduct(productId, {
        name,
        description: description || null,
        active,
      });
      setProduct(updated);
    } catch (err) {
      setDetailsError(
        err instanceof CatalogError ? err.message : "Couldn't save product details.",
      );
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleUploadPhoto() {
    if (!photoFile) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const updated = await uploadProductPhoto(productId, photoFile);
      setProduct(updated);
      setPhotoFile(null);
    } catch (err) {
      setPhotoError(err instanceof CatalogError ? err.message : "Couldn't upload the photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSaveVariant(variantId: number, body: Partial<VariantInput & { active: boolean }>) {
    setVariantError(null);
    try {
      const updated = await updateVariant(productId, variantId, body);
      setProduct(updated);
    } catch (err) {
      setVariantError(err instanceof CatalogError ? err.message : "Couldn't save that variant.");
    }
  }

  async function handleAddVariant(e: FormEvent) {
    e.preventDefault();
    setVariantError(null);
    setAddingVariant(true);
    try {
      const updated = await createVariant(productId, newVariant);
      setProduct(updated);
      setNewVariant({ size: "", color: "", price: 0, stock: 0 });
    } catch (err) {
      setVariantError(err instanceof CatalogError ? err.message : "Couldn't add that variant.");
    } finally {
      setAddingVariant(false);
    }
  }

  if (loadError) {
    return (
      <div>
        <Link href="/admin/products" className={styles.backLink}>
          ← Products
        </Link>
        <p className={styles.error}>{loadError}</p>
      </div>
    );
  }

  if (!product) {
    return <p>Loading…</p>;
  }

  return (
    <div>
      <Link href="/admin/products" className={styles.backLink}>
        ← Products
      </Link>
      <h1 className={styles.title}>{product.name}</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <form onSubmit={handleSaveDetails}>
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
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className={styles.checkboxField}>
            <input type="checkbox" className={styles.checkbox} checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (visible in the storefront)
          </label>
          {detailsError && (
            <p className={styles.error} role="alert">
              {detailsError}
            </p>
          )}
          <button type="submit" className={styles.secondaryButton} disabled={savingDetails}>
            {savingDetails ? "Saving…" : "Save details"}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Photo</h2>
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.name} className={styles.photoPreview} />
        ) : (
          <p>No photo yet.</p>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />
        <div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleUploadPhoto}
            disabled={!photoFile || uploadingPhoto}
          >
            {uploadingPhoto ? "Uploading…" : "Upload photo"}
          </button>
        </div>
        {photoError && (
          <p className={styles.error} role="alert">
            {photoError}
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Variants</h2>
        {variantError && (
          <p className={styles.error} role="alert">
            {variantError}
          </p>
        )}
        <div className={styles.tableScroll}>
          <table className={`${styles.table} ${styles.tableWide}`}>
            <thead>
              <tr>
                <th>Size</th>
                <th>Color</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groupByColor(product.variants).map(({ color, variants }) => (
                <Fragment key={color}>
                  <tr>
                    <th className={styles.variantGroupHeading} colSpan={6}>
                      {color}
                    </th>
                  </tr>
                  {variants.map((variant) => (
                    <VariantRow key={variant.id} variant={variant} onSave={handleSaveVariant} />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className={styles.sectionTitle}>Add variant</h3>
        <form onSubmit={handleAddVariant} className={styles.variantRow}>
          <input
            className={styles.variantInput}
            placeholder="Size"
            value={newVariant.size ?? ""}
            onChange={(e) => setNewVariant((v) => ({ ...v, size: e.target.value || null }))}
          />
          <input
            className={styles.variantInput}
            placeholder="Color"
            value={newVariant.color ?? ""}
            onChange={(e) => setNewVariant((v) => ({ ...v, color: e.target.value || null }))}
          />
          <input
            className={styles.variantInput}
            type="number"
            placeholder="Price"
            value={newVariant.price}
            onChange={(e) => setNewVariant((v) => ({ ...v, price: Number(e.target.value) || 0 }))}
          />
          <input
            className={styles.variantInput}
            type="number"
            placeholder="Stock"
            value={newVariant.stock}
            onChange={(e) => setNewVariant((v) => ({ ...v, stock: Number(e.target.value) || 0 }))}
          />
          <button type="submit" className={styles.secondaryButton} disabled={addingVariant}>
            {addingVariant ? "Adding…" : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  onSave,
}: {
  variant: Variant;
  onSave: (variantId: number, body: Partial<VariantInput & { active: boolean }>) => Promise<void>;
}) {
  const [size, setSize] = useState(variant.size ?? "");
  const [color, setColor] = useState(variant.color ?? "");
  const [price, setPrice] = useState(variant.price);
  const [stock, setStock] = useState(variant.stock);
  const [active, setActive] = useState(variant.active);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(variant.id, { size: size || null, color: color || null, price, stock, active });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <input
          className={styles.variantInput}
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.variantInput}
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.variantInput}
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value) || 0)}
        />
      </td>
      <td>
        <input
          className={styles.variantInput}
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value) || 0)}
        />
      </td>
      <td>
        <input type="checkbox" className={styles.checkbox} checked={active} onChange={(e) => setActive(e.target.checked)} />
      </td>
      <td>
        <button type="button" className={styles.secondaryButton} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </td>
    </tr>
  );
}
