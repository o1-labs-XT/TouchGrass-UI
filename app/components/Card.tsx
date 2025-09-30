'use client';
import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  centered?: boolean;
  className?: string;
}

export default function Card({
  children,
  centered = false,
  className = ''
}: CardProps) {
  return (
    <div className={`${styles.card} ${centered ? styles.centered : ''} ${className}`}>
      {children}
    </div>
  );
}