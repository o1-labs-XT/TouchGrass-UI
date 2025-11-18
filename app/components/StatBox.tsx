'use client';
import React from 'react';
import Image from 'next/image';
import styles from './StatBox.module.css';

interface StatBoxProps {
  value: number | string;
  label: string;
  icon?: string;
}

export default function StatBox({ value, label, icon }: StatBoxProps) {
  return (
    <div className={styles.statBox}>
      {icon && (
        <Image
          src={icon}
          alt={label}
          width={24}
          height={24}
          className={styles.icon}
        />
      )}
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}