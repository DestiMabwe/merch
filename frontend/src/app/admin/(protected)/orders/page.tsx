"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AdminOrdersError,
  listAdminOrders,
  statusBadgeVariant,
  type AdminOrderSummary,
} from "@/lib/adminOrders";
import { statusLabel } from "@/lib/orders";
import styles from "../../admin.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "ready_for_collection", label: "Ready for Collection" },
  { value: "collected", label: "Collected" },
  { value: "cancelled", label: "Cancelled" },
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [sort, setSort] = useState<"oldest" | "newest">("oldest");
  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminOrders({ status: status || undefined, sort })
      .then(setOrders)
      .catch((err) =>
        setError(err instanceof AdminOrdersError ? err.message : "Couldn't load orders."),
      );
  }, [status, sort]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Orders</h1>
      </div>

      <div className={styles.variantRow}>
        <select
          className={styles.input}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
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
      {!error && !orders && <p>Loading…</p>}
      {orders && orders.length === 0 && <p>No orders match that filter.</p>}

      {orders && orders.length > 0 && (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Proof of Payment</th>
                <th>Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.reference}>
                  <td>
                    <Link href={`/admin/orders/${order.reference}`} className={styles.rowLink}>
                      {order.reference}
                    </Link>
                  </td>
                  <td>{order.customer_name}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${styles[`badge${statusBadgeVariant(order.status)}`]}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    {order.proof_of_payment_url ? (
                      <a
                        href={order.proof_of_payment_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${styles.badge} ${styles.badgeFilled}`}
                      >
                        Attached
                      </a>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeOutlined}`}>Missing</span>
                    )}
                  </td>
                  <td>R{order.total}</td>
                  <td>{timeAgo(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
