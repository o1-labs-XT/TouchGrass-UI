'use client';
import React from 'react';
import styles from './GrassyButton.module.css';

interface GrassyButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export default function GrassyButton({
  variant,
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}: GrassyButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.grassyButton} ${styles[variant]} ${disabled ? styles.disabled : ''} ${className}`}
    >
      <span className={styles.text}>{children}</span>
    </button>
  );
}
