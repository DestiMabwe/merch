import styles from "./lineup.module.css";

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
      {process.env.NODE_ENV !== "production" && (
        <p className={styles.status}>Backend status: {status ?? "checking..."}</p>
      )}
    </footer>
  );
}
