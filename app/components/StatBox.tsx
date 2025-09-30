'use client';
import React from 'react';
import styles from './StatBox.module.css';

interface StatBoxProps {
  value: number | string;
  label: string;
}

export default function StatBox({ value, label }: StatBoxProps) {
  return (
    <div className={styles.statBox}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}