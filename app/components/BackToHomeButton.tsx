'use client';
import Link from 'next/link';
import styles from './BackToHomeButton.module.css';

export default function BackToHomeButton() {
  return (
    <Link href="/" className={styles.backLink}>
      ← Back to Home
    </Link>
  );
}