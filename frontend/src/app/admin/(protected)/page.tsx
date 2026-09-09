"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminOrdersError, listAdminOrders, type AdminOrderSummary } from "@/lib/adminOrders";
import { statusLabel } from "@/lib/orders";
import styles from "../admin.module.css";

const STATUS_ORDER = ["pending_payment", "paid", "ready_for_collection", "collected", "cancelled"];

export default function AdminHomePage() {
  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminOrders({})
      .then(setOrders)
      .catch((err) =>
        setError(err instanceof AdminOrdersError ? err.message : "Couldn't load the order summary."),
      );
  }, []);

  const counts = orders
    ? STATUS_ORDER.map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      }))
    : null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Dashboard</h1>
        <Link href="/admin/products" className={styles.linkButton}>
          Manage products
        </Link>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Orders by Status</h2>

        {error && <p className={styles.error}>{error}</p>}
        {!error && !counts && <p>Loading…</p>}

        {counts && (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <tbody>
                {counts.map(({ status, count }) => (
                  <tr key={status}>
                    <td>
                      <Link href={`/admin/orders?status=${status}`} className={styles.rowLink}>
                        {statusLabel(status)}
                      </Link>
                    </td>
                    <td className={styles.dashboardCount}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
