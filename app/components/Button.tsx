'use client';
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'clean';
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export default function Button({
  variant,
  children,
  onClick,
  href,
  disabled = false,
  type = 'button',
  className = ''
}: ButtonProps) {
  const buttonClasses = `
    ${styles.button} 
    ${styles[variant]} 
    ${disabled ? styles.disabled : ''}
    ${className}
  `.trim();

  if (href) {
    return (
      <a
        href={href}
        className={buttonClasses}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the original onClick if it exists
    if (onClick) {
      onClick();
    }
    // Remove focus after click to prevent stuck appearance
    setTimeout(() => {
      e.currentTarget.blur();
    }, 100);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
}