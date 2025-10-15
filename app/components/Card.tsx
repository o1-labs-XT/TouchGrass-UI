'use client';
import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  centered?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  centered = false,
  className = '',
  onClick
}: CardProps) {
  return (
    <div 
      className={`${styles.card} ${centered ? styles.centered : ''} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}