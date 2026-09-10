"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminOrdersError,
  listOrderItems,
  markOrderCollected,
  markOrderPaid,
  markOrderReadyForCollection,
  statusBadgeVariant,
  updateLineItem,
  uploadAdminProofOfPayment,
  type AdminOrderDetail,
  type ProductionLineItem,
} from "@/lib/adminOrders";
import { listProducts, type Product } from "@/lib/catalog";
import { statusLabel } from "@/lib/orders";
import styles from "../../admin.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "All except cancelled" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "ready_for_collection", label: "Ready for Collection" },
  { value: "collected", label: "Collected" },
  { value: "cancelled", label: "Cancelled" },
];

// Same "still in play" set as the order detail page — line items can only be
// edited (including naming a recipient) while an order is in one of these.
const ACTIVE_STATUSES = new Set(["pending_payment", "paid", "ready_for_collection"]);

// The next lifecycle step for each status — same progression the order
// detail page walks through, surfaced here so the supplier can advance an
// order without leaving the print list.
const STATUS_ACTIONS: Record<string, { label: string; action: (ref: string) => Promise<AdminOrderDetail> }> = {
  pending_payment: { label: "Mark payment received", action: markOrderPaid },
  paid: { label: "Mark ready for collection", action: markOrderReadyForCollection },
  ready_for_collection: { label: "Mark collected", action: markOrderCollected },
};

function variantText(item: Pick<ProductionLineItem, "variant_size" | "variant_color">): string {
  return [item.variant_size, item.variant_color].filter(Boolean).join(" / ") || "One size";
}

// This sale is a single campaign, one design across three garments (per
// PRODUCT.md) — every product name repeats the same "Purpose Over Pressure"
// prefix, which just wraps and eats row height in a dense per-item list.
// Drop it here; the full name still appears in the Print Run summary above.
const CAMPAIGN_PREFIX = "Purpose Over Pressure ";
function shortProductName(name: string): string {
  return name.startsWith(CAMPAIGN_PREFIX) ? name.slice(CAMPAIGN_PREFIX.length) : name;
}

export default function AdminProductionPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"oldest" | "newest">("oldest");
  const [items, setItems] = useState<ProductionLineItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pendingOrders, setPendingOrders] = useState<Set<string>>(new Set());
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    setItems(null);
    listOrderItems({ productId: productId ? Number(productId) : undefined, status: status || undefined, sort })
      .then(setItems)
      .catch((err) =>
        setError(err instanceof AdminOrdersError ? err.message : "Couldn't load the print list."),
      );
  }, [productId, status, sort]);

  const aggregate = useMemo(() => {
    if (!items) return [];
    const totals = new Map<string, { product_name: string; variant: string; qty: number }>();
    for (const item of items) {
      const key = `${item.product_name}__${variantText(item)}`;
      const existing = totals.get(key);
      if (existing) {
        existing.qty += item.quantity;
      } else {
        totals.set(key, { product_name: item.product_name, variant: variantText(item), qty: item.quantity });
      }
    }
    return Array.from(totals.values()).sort(
      (a, b) => a.product_name.localeCompare(b.product_name) || a.variant.localeCompare(b.variant),
    );
  }, [items]);

  const totalPieces = aggregate.reduce((sum, row) => sum + row.qty, 0);

  function handleRecipientUpdate(itemId: number, recipientName: string | null) {
    setItems((current) =>
      current ? current.map((item) => (item.id === itemId ? { ...item, recipient_name: recipientName } : item)) : current,
    );
  }

  function handleProofUploaded(orderReference: string, proofUrl: string | null) {
    // Same order-level fan-out as a status change — a proof file belongs to
    // the order, not one line item, so every matching row picks it up.
    setItems((current) =>
      current
        ? current.map((item) =>
            item.order_reference === orderReference ? { ...item, order_proof_of_payment_url: proofUrl } : item,
          )
        : current,
    );
  }

  async function handleStatusAction(
    orderReference: string,
    action: (ref: string) => Promise<AdminOrderDetail>,
  ) {
    setStatusErrors((prev) => {
      const next = { ...prev };
      delete next[orderReference];
      return next;
    });
    setPendingOrders((prev) => new Set(prev).add(orderReference));
    try {
      const updated = await action(orderReference);
      // An order can have several matching rows (e.g. two tees in different
      // sizes) — the status change applies to the whole order, so update
      // every row that shares this reference.
      setItems((current) =>
        current
          ? current.map((item) =>
              item.order_reference === orderReference ? { ...item, order_status: updated.status } : item,
            )
          : current,
      );
    } catch (err) {
      setStatusErrors((prev) => ({
        ...prev,
        [orderReference]: err instanceof AdminOrdersError ? err.message : "Couldn't update this order.",
      }));
    } finally {
      setPendingOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderReference);
        return next;
      });
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Production</h1>
      </div>

      <div className={styles.variantRow}>
        <select className={styles.input} value={productId} onChange={(event) => setProductId(event.target.value)}>
          <option value="">All products</option>
          {products?.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <select className={styles.input} value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className={styles.input}
          value={sort}
          onChange={(event) => setSort(event.target.value as "oldest" | "newest")}
        >
          <option value="oldest">Oldest pending first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {!error && !items && <p>Loading…</p>}

      {items && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Print run ({totalPieces} piece{totalPieces === 1 ? "" : "s"})</h2>
          {aggregate.length === 0 ? (
            <p>Nothing matches this filter.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Qty to print</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregate.map((row) => (
                    <tr key={`${row.product_name}__${row.variant}`}>
                      <td>{row.product_name}</td>
                      <td>{row.variant}</td>
                      <td className={styles.dashboardCount}>{row.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {items && items.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Orders</h2>
          <div className={styles.tableScroll}>
            <table className={`${styles.table} ${styles.tableWide}`}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Recipient</th>
                  <th>Proof</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ProductionItemRow
                    key={item.id}
                    item={item}
                    pending={pendingOrders.has(item.order_reference)}
                    statusError={statusErrors[item.order_reference]}
                    onRecipientUpdate={handleRecipientUpdate}
                    onStatusAction={handleStatusAction}
                    onProofUploaded={handleProofUploaded}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductionItemRow({
  item,
  pending,
  statusError,
  onRecipientUpdate,
  onStatusAction,
  onProofUploaded,
}: {
  item: ProductionLineItem;
  pending: boolean;
  statusError: string | undefined;
  onRecipientUpdate: (itemId: number, recipientName: string | null) => void;
  onStatusAction: (orderReference: string, action: (ref: string) => Promise<AdminOrderDetail>) => void;
  onProofUploaded: (orderReference: string, proofUrl: string | null) => void;
}) {
  const [recipientName, setRecipientName] = useState(item.recipient_name ?? "");
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const editable = ACTIVE_STATUSES.has(item.order_status);
  const dirty = recipientName.trim() !== (item.recipient_name ?? "");

  async function handleSaveRecipient() {
    setRowError(null);
    setSaving(true);
    try {
      await updateLineItem(item.order_reference, item.id, { recipient_name: recipientName.trim() });
      onRecipientUpdate(item.id, recipientName.trim() || null);
    } catch (err) {
      setRowError(err instanceof AdminOrdersError ? err.message : "Couldn't save this name.");
    } finally {
      setSaving(false);
    }
  }

  const nextAction = STATUS_ACTIONS[item.order_status];
  const missingProof = item.order_status === "pending_payment" && !item.order_proof_of_payment_url;

  return (
    <tr>
      <td>
        <Link href={`/admin/orders/${item.order_reference}`} className={styles.rowLink}>
          {item.order_reference}
        </Link>
      </td>
      <td>{item.customer_name}</td>
      <td>
        {shortProductName(item.product_name)} — {variantText(item)}
      </td>
      <td className={styles.dashboardCount}>{item.quantity}</td>
      <td>
        {editable ? (
          <div className={styles.variantRow}>
            <input
              className={styles.recipientInput}
              type="text"
              placeholder="Whose?"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleSaveRecipient}
              disabled={saving || !dirty}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          item.recipient_name || "—"
        )}
        {rowError && (
          <p className={styles.error} role="alert">
            {rowError}
          </p>
        )}
      </td>
      <td>
        <ProofCell item={item} onProofUploaded={onProofUploaded} />
      </td>
      <td>
        <span className={`${styles.badge} ${styles[`badge${statusBadgeVariant(item.order_status)}`]}`}>
          {statusLabel(item.order_status)}
        </span>
      </td>
      <td>
        {nextAction ? (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onStatusAction(item.order_reference, nextAction.action)}
            disabled={pending || missingProof}
            title={missingProof ? "Upload proof of payment (Proof column) before marking it paid" : undefined}
          >
            {pending ? "Updating…" : nextAction.label}
          </button>
        ) : (
          "—"
        )}
        {statusError && (
          <p className={styles.error} role="alert">
            {statusError}
          </p>
        )}
      </td>
    </tr>
  );
}

// Payment isn't always confirmed through the self-service upload — a
// customer might just inbox a screenshot to a secretary. This lets staff
// attach whatever proof they were sent (or note payment some other way via
// a file) without leaving the print list, so "mark paid" doesn't get stuck.
function ProofCell({
  item,
  onProofUploaded,
}: {
  item: ProductionLineItem;
  onProofUploaded: (orderReference: string, proofUrl: string | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (item.order_proof_of_payment_url) {
    return (
      <a
        href={item.order_proof_of_payment_url}
        target="_blank"
        rel="noreferrer"
        className={`${styles.badge} ${styles.badgeFilled}`}
      >
        Attached
      </a>
    );
  }

  async function handleUpload() {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const updated = await uploadAdminProofOfPayment(item.order_reference, file);
      onProofUploaded(item.order_reference, updated.proof_of_payment_url);
      setFile(null);
    } catch (err) {
      setUploadError(err instanceof AdminOrdersError ? err.message : "Couldn't upload that file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className={`${styles.badge} ${styles.badgeOutlined}`}>Missing</span>
      <div className={styles.variantRow}>
        <label className={`${styles.secondaryButton} ${styles.fileInputLabel} ${styles.fileInputWrap}`}>
          <input
            className={styles.fileInputHidden}
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          {file ? file.name : "Choose file"}
        </label>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {uploadError && (
        <p className={styles.error} role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
