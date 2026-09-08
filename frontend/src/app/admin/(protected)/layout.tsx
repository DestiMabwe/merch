"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, fetchMe, getToken } from "@/lib/adminAuth";
import styles from "../admin.module.css";

type AuthState =
  | { status: "checking" }
  | { status: "authenticated"; email: string }
  | { status: "unauthenticated" };

export default function ProtectedAdminLayout({ children }: LayoutProps<"/admin">) {
  const router = useRouter();
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

  if (auth.status !== "authenticated") {
    return null;
  }

  return (
    <div>
      <header className={styles.header}>
        <span className={styles.headerTitle}>Camp Merch Admin</span>
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
