"use client";

import { useState, useRef, useEffect } from "react";
import type { Submission } from "../lib/backendClient";
import { getImageUrl } from "../lib/backendClient";
import LikeButton from "./LikeButton";
import styles from "./SubmissionCarousel3D.module.css";

interface SubmissionCarousel3DProps {
  submissions: Submission[];
}

export default function SubmissionCarousel3D({
  submissions
}: SubmissionCarousel3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);
  const touchDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const offset = e.clientX - startX;

    if (Math.abs(offset) > 5) {
      hasDraggedRef.current = true;
    }

    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (!hasDraggedRef.current) {
      setDragOffset(0);
      return;
    }

    if (!isTransitioning) {
      setIsTransitioning(true);

      const sensitivity = 150;
      const dragInfluence = dragOffset / sensitivity;

      let closestIndex = currentIndex;
      let minDistance = Infinity;

      submissions.forEach((_, index) => {
        let position = index - currentIndex;
        if (position > submissions.length / 2) {
          position -= submissions.length;
        } else if (position < -submissions.length / 2) {
          position += submissions.length;
        }
        position += dragInfluence;

        const distance = Math.abs(position);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentIndex(closestIndex);
      setTimeout(() => setIsTransitioning(false), 600);
    }

    setDragOffset(0);
    hasDraggedRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setDragOffset(0);
    hasDraggedRef.current = false;
    touchDirectionRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const offsetX = e.touches[0].clientX - startX;
    const offsetY = e.touches[0].clientY - startY;

    // Determine scroll direction on first movement
    if (touchDirectionRef.current === null && (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5)) {
      touchDirectionRef.current = Math.abs(offsetX) > Math.abs(offsetY) ? 'horizontal' : 'vertical';
    }

    // If horizontal swipe, prevent vertical scrolling
    if (touchDirectionRef.current === 'horizontal') {
      e.preventDefault();
      hasDraggedRef.current = true;
      setDragOffset(offsetX);
    } else if (touchDirectionRef.current === 'vertical') {
      // Allow vertical scroll, cancel carousel drag
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (!hasDraggedRef.current || touchDirectionRef.current !== 'horizontal') {
      setDragOffset(0);
      touchDirectionRef.current = null;
      return;
    }

    if (!isTransitioning) {
      setIsTransitioning(true);

      const sensitivity = 150;
      const dragInfluence = dragOffset / sensitivity;

      let closestIndex = currentIndex;
      let minDistance = Infinity;

      submissions.forEach((_, index) => {
        let position = index - currentIndex;
        if (position > submissions.length / 2) {
          position -= submissions.length;
        } else if (position < -submissions.length / 2) {
          position += submissions.length;
        }
        position += dragInfluence;

        const distance = Math.abs(position);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentIndex(closestIndex);
      setTimeout(() => setIsTransitioning(false), 600);
    }

    setDragOffset(0);
    hasDraggedRef.current = false;
    touchDirectionRef.current = null;
  };

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.cursor = "default";
    }
    return () => {
      document.body.style.cursor = "default";
    };
  }, [isDragging]);

  const getCardStyle = (index: number) => {
    let position = index - currentIndex;

    if (position > submissions.length / 2) {
      position -= submissions.length;
    } else if (position < -submissions.length / 2) {
      position += submissions.length;
    }

    const dragInfluence = dragOffset / 150;
    position += dragInfluence;

    const radius = 650;
    const angleStep = 28;
    const angle = position * angleStep;
    const angleRad = (angle * Math.PI) / 180;

    const translateX = Math.sin(angleRad) * radius;
    const translateZ = Math.cos(angleRad) * radius - radius;
    const rotateY = -angle;
    const scale = Math.max(0.5, 1 - Math.abs(position) * 0.12);
    const opacity = Math.max(0.3, 1 - Math.abs(position) * 0.18);
    const zIndex = Math.max(1, Math.round(100 - Math.abs(position) * 5));

    return {
      transform: `
        translateX(${translateX}px)
        translateZ(${translateZ}px)
        rotateY(${rotateY}deg)
        scale(${scale})
      `,
      opacity,
      zIndex,
      transition: isDragging ? "none" : "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
    };
  };

  return (
    <div className={styles.container}>
      {/* Heading */}
      <h2 className={styles.heading}>
        Chain Images ({submissions.length})
      </h2>

      <div
        ref={containerRef}
        className={styles.carouselWrapper}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`${styles.carouselTrack} ${
            isDragging ? styles.grabbing : styles.grab
          }`}
        >
          {submissions.map((submission, index) => (
            <div
              key={submission.id}
              className={styles.cardPositioner}
              style={getCardStyle(index)}
            >
              <div
                className={styles.card}
                style={{
                  cursor: index === currentIndex ? "pointer" : "default"
                }}
              >
                <img
                  src={getImageUrl(submission.id)}
                  alt={
                    submission.tagline ||
                    `Submission #${submission.chainPosition}`
                  }
                  className={styles.cardImage}
                  draggable="false"
                />
                <div className={styles.gradientOverlay} />
                {index === currentIndex && !isDragging && (
                  <div className={styles.activeOverlay} />
                )}
              </div>

              {index === currentIndex && (
                <button className={styles.likeButton} aria-label="Like image">
                  <Heart className={styles.heartIcon} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.indicators}>
        {submissions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (isTransitioning) return;
              setIsTransitioning(true);
              setCurrentIndex(index);
              setTimeout(() => setIsTransitioning(false), 600);
            }}
            className={`${styles.indicator} ${
              index === currentIndex ? styles.indicatorActive : ""
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
