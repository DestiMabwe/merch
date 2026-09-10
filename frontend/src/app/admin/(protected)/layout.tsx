"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, fetchMe, getToken } from "@/lib/adminAuth";
import styles from "../admin.module.css";

type AuthState =
  | { status: "checking" }
  | { status: "authenticated"; email: string }
  | { status: "unauthenticated" };

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/production", label: "Production" },
];

export default function ProtectedAdminLayout({ children }: LayoutProps<"/admin">) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    fetchMe(token)
      .then(({ email }) => setAuth({ status: "authenticated", email }))
      .catch(() => {
        clearToken();
        router.replace("/admin/login");
      });
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/admin/login");
  }

  if (auth.status === "checking") {
    return (
      <div className={styles.screen}>
        <p className={styles.checkingLabel}>Checking your session…</p>
      </div>
    );
  }

  if (auth.status !== "authenticated") {
    return null;
  }

  return (
    <div>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBrand}>
            <img src="/church-logo.png" alt="" width={24} height={24} />
            <span className={styles.headerTitle}>Purpose Over Pressure — Admin</span>
          </div>
          <nav className={styles.headerNav}>
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.headerNavLink}
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive || undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.headerEmail}>{auth.email}</span>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
