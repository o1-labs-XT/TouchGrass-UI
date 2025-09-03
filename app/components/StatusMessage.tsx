"use client";
import styles from "./StatusMessage.module.css";

interface StatusMessageProps {
  type: "warning" | "info" | "error" | "success" | "processing";
  message: string;
  showSpinner?: boolean;
}

export default function StatusMessage({
  type,
  message,
  showSpinner = false
}: StatusMessageProps) {
  return (
    <div className={`${styles.statusMessage} ${styles[type]}`}>
      {showSpinner && <div className={styles.spinner}></div>}
      <p className={styles.messageText}>{message}</p>
    </div>
  );
}
