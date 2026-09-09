"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import styles from "./lineup.module.css";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className={styles.cartLink}>
      🛒 Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}

export function StorefrontMark() {
  return (
    <div className={styles.mark}>
      <img src="/church-logo.png" alt="" width={32} height={32} className={styles.markImg} />
      <span className={styles.markText}>Forward In Faith Ministries Int.</span>
    </div>
  );
}

export function StorefrontFooter({ status }: { status: string | null }) {
  return (
    <footer className={styles.footer}>
      <img
        src="/church-logo.png"
        alt="Forward In Faith Ministries Int."
        width={34}
        height={34}
        className={styles.footerMark}
      />
      <p className={styles.footerText}>Bound by the Spirit of God</p>
      <Link href="/orders" className={styles.footerLink}>
        Track your order →
      </Link>
      <Link href="/admin/login" className={styles.footerLink}>
        Staff login →
      </Link>
      {process.env.NODE_ENV !== "production" && (
        <p className={styles.status}>Backend status: {status ?? "checking..."}</p>
      )}
    </footer>
  );
}
