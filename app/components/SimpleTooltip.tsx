"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import styles from "./SimpleTooltip.module.css";

interface SimpleTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export default function SimpleTooltip({ children, content, side = "right" }: SimpleTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.container}>
      <div
        ref={triggerRef}
        className={styles.trigger}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={handleTriggerInteraction}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={handleTriggerInteraction}
      >
        {children}
      </div>
      {isOpen && (
        <div
          ref={tooltipRef}
          className={`${styles.tooltip} ${styles[side]}`}
        >
          <div className={styles.content}>
            {content}
          </div>
          <div className={`${styles.arrow} ${styles[`arrow${side.charAt(0).toUpperCase() + side.slice(1)}`]}`} />
        </div>
      )}
    </div>
  );
}
