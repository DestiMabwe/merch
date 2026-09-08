import Link from "next/link";
import styles from "../admin.module.css";

export default function AdminHomePage() {
  return (
    <div>
      <p>You&rsquo;re logged in to the camp merch admin panel.</p>
      <p>
        <Link href="/admin/products" className={styles.linkButton}>
          Manage products
        </Link>
      </p>
    </div>
  );
}
