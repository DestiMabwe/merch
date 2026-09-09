"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AdminOrdersError,
  cancelOrder,
  deleteLineItem,
  getAdminOrder,
  markOrderCollected,
  markOrderPaid,
  markOrderReadyForCollection,
  statusBadgeVariant,
  updateLineItem,
  uploadAdminProofOfPayment,
  type AdminOrderDetail,
  type AdminOrderLineItem,
} from "@/lib/adminOrders";
import { getProduct, type Variant } from "@/lib/catalog";
import { statusLabel } from "@/lib/orders";
import styles from "../../../admin.module.css";

const STATUS_ACTIONS: Record<string, { label: string; action: (ref: string) => Promise<AdminOrderDetail> }> = {
  pending_payment: { label: "Mark payment received", action: markOrderPaid },
  paid: { label: "Mark ready for collection", action: markOrderReadyForCollection },
  ready_for_collection: { label: "Mark collected", action: markOrderCollected },
};

// Orders still "in play" — the same set can be cancelled and can have their
// line items edited; once collected or cancelled, there's nothing left to change.
const ACTIVE_STATUSES = new Set(["pending_payment", "paid", "ready_for_collection"]);

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = use(params);

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusActionPending, setStatusActionPending] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [cancelArmed, setCancelArmed] = useState(false);
  const cancelArmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cancelArmTimer.current) clearTimeout(cancelArmTimer.current);
    };
  }, []);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOrder(reference)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof AdminOrdersError ? err.message : "Couldn't load this order."),
      );
  }, [reference]);

  async function runStatusAction(action: (ref: string) => Promise<AdminOrderDetail>) {
    setStatusActionError(null);
    setStatusActionPending(true);
    try {
      setOrder(await action(reference));
    } catch (err) {
      setStatusActionError(
        err instanceof AdminOrdersError ? err.message : "Couldn't update this order's status.",
      );
    } finally {
      setStatusActionPending(false);
    }
  }

  function handleCancelClick() {
    if (!cancelArmed) {
      setCancelArmed(true);
      cancelArmTimer.current = setTimeout(() => setCancelArmed(false), 4000);
      return;
    }
    if (cancelArmTimer.current) clearTimeout(cancelArmTimer.current);
    setCancelArmed(false);
    runStatusAction(cancelOrder);
  }

  async function handleUploadProof() {
    if (!proofFile) return;
    setProofError(null);
    setUploadingProof(true);
    try {
      setOrder(await uploadAdminProofOfPayment(reference, proofFile));
      setProofFile(null);
    } catch (err) {
      setProofError(err instanceof AdminOrdersError ? err.message : "Couldn't upload that file.");
    } finally {
      setUploadingProof(false);
    }
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!order) {
    return <p>Loading…</p>;
  }

  const nextAction = STATUS_ACTIONS[order.status];
  const missingProof = order.status === "pending_payment" && !order.proof_of_payment_url;

  return (
    <div>
      <Link href="/admin/orders" className={styles.backLink}>
        ← Orders
      </Link>
      <h1 className={styles.title}>{order.reference}</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Status</h2>
        <p>
          <span
            className={`${styles.badge} ${styles[`badge${statusBadgeVariant(order.status)}`]}`}
          >
            {statusLabel(order.status)}
          </span>
        </p>
        <div className={styles.variantRow}>
          {nextAction && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => runStatusAction(nextAction.action)}
              disabled={statusActionPending || missingProof}
              title={missingProof ? "Attach proof of payment before marking this order as paid" : undefined}
            >
              {statusActionPending ? "Updating…" : nextAction.label}
            </button>
          )}
          {ACTIVE_STATUSES.has(order.status) && (
            <button
              type="button"
              className={`${styles.secondaryButton} ${cancelArmed ? styles.secondaryButtonArmed : ""}`}
              onClick={handleCancelClick}
              disabled={statusActionPending}
            >
              {statusActionPending
                ? "Updating…"
                : cancelArmed
                  ? "Really cancel? Click to confirm"
                  : "Cancel order"}
            </button>
          )}
        </div>
        {missingProof && (
          <p className={styles.editLockedNote}>
            Attach proof of payment below before this order can be marked paid.
          </p>
        )}
        {statusActionError && (
          <p className={styles.error} role="alert">
            {statusActionError}
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Customer</h2>
        <p>{order.customer_name}</p>
        {order.customer_email && <p>{order.customer_email}</p>}
        {order.customer_phone && <p>{order.customer_phone}</p>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Items</h2>
        {!ACTIVE_STATUSES.has(order.status) && (
          <p className={styles.editLockedNote}>
            This order is {statusLabel(order.status).toLowerCase()} — items can no longer be
            changed.
          </p>
        )}
        <div className={styles.tableScroll}>
          <table className={`${styles.table} ${styles.tableWide}`}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <LineItemRow
                  key={item.id}
                  reference={reference}
                  item={item}
                  editable={ACTIVE_STATUSES.has(order.status)}
                  onChange={setOrder}
                />
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.orderTotal}>Total: R{order.total}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Proof of Payment</h2>
        {order.proof_of_payment_url ? (
          <p>
            <a href={order.proof_of_payment_url} target="_blank" rel="noreferrer">
              View uploaded file →
            </a>
          </p>
        ) : (
          <p>No proof of payment uploaded yet.</p>
        )}
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
        />
        <div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleUploadProof}
            disabled={!proofFile || uploadingProof}
          >
            {uploadingProof
              ? "Uploading…"
              : order.proof_of_payment_url
                ? "Replace file"
                : "Upload file"}
          </button>
        </div>
        {proofError && (
          <p className={styles.error} role="alert">
            {proofError}
          </p>
        )}
      </div>
    </div>
  );
}

function variantLabel(variant: Pick<Variant, "size" | "color">): string {
  return [variant.size, variant.color].filter(Boolean).join(" / ") || "One size";
}

function LineItemRow({
  reference,
  item,
  editable,
  onChange,
}: {
  reference: string;
  item: AdminOrderLineItem;
  editable: boolean;
  onChange: (order: AdminOrderDetail) => void;
}) {
  const [siblingVariants, setSiblingVariants] = useState<Variant[] | null>(null);
  const [variantId, setVariantId] = useState(item.variant_id);
  const [quantity, setQuantity] = useState(item.quantity);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    if (!editable) return;
    getProduct(item.product_id)
      .then((product) => setSiblingVariants(product.variants.filter((v) => v.active)))
      .catch(() => setSiblingVariants([]));
  }, [item.product_id, editable]);

  async function handleSave() {
    setRowError(null);
    setSaving(true);
    try {
      const body: { variant_id?: number; quantity?: number } = {};
      if (variantId !== item.variant_id) body.variant_id = variantId;
      if (quantity !== item.quantity) body.quantity = quantity;
      onChange(await updateLineItem(reference, item.id, body));
    } catch (err) {
      setRowError(err instanceof AdminOrdersError ? err.message : "Couldn't save this item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRowError(null);
    setSaving(true);
    try {
      onChange(await deleteLineItem(reference, item.id));
    } catch (err) {
      setRowError(err instanceof AdminOrdersError ? err.message : "Couldn't remove this item.");
    } finally {
      setSaving(false);
    }
  }

  const dirty = variantId !== item.variant_id || quantity !== item.quantity;
  const variantText =
    [item.variant_size, item.variant_color].filter(Boolean).join(" / ") || "One size";

  if (!editable) {
    return (
      <tr>
        <td>{item.product_name}</td>
        <td>{variantText}</td>
        <td>{item.quantity}</td>
        <td>R{item.unit_price}</td>
        <td>R{item.unit_price * item.quantity}</td>
        <td></td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{item.product_name}</td>
      <td>
        {siblingVariants ? (
          <select
            className={styles.variantInput}
            value={variantId}
            onChange={(event) => setVariantId(Number(event.target.value))}
          >
            {!siblingVariants.some((v) => v.id === item.variant_id) && (
              <option value={item.variant_id}>{variantText}</option>
            )}
            {siblingVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {variantLabel(v)}
              </option>
            ))}
          </select>
        ) : (
          variantText
        )}
      </td>
      <td>
        <input
          className={styles.variantInput}
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value) || 1)}
        />
      </td>
      <td>R{item.unit_price}</td>
      <td>R{item.unit_price * item.quantity}</td>
      <td>
        <div className={styles.variantRow}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleRemove} disabled={saving}>
            Remove
          </button>
        </div>
        {rowError && (
          <p className={styles.error} role="alert">
            {rowError}
          </p>
        )}
      </td>
    </tr>
  );
}
