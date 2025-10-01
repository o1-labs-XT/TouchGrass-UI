'use client';
import React from 'react';
import styles from './BackButton.module.css';

interface BackButtonProps {
  onClick: () => void;
}

export default function BackButton({ onClick }: BackButtonProps) {
  return (
    <button onClick={onClick} className={styles.backButton}>
      ← Back
    </button>
  );
}
