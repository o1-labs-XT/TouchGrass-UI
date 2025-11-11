# 3D Carousel Implementation Plan

## Overview
Replace vertical card grid with 3D horizontal carousel. Clicking center card opens modal. Share URLs use query parameters for unified experience with social preview support.

## Key Architecture Decisions

### URL Strategy & Social Sharing
- **Share URL format**: `/chain/123?submission=456`
- **Redirect**: `/submission/456` → `/chain/123?submission=456`
- **Metadata**: `generateMetadata()` on chain page reads `searchParams.submission` to generate submission-specific OpenGraph tags
- **User experience**: Shared links open carousel with correct submission modal already open
- **Social previews**: Show submission-specific image, title, description

### CSS Variables
Use existing variables where colors match:
- `var(--brand-primary)` for #003712
- `var(--brand-secondary-text)` for #4D4D4D
- `var(--mina-white)` for #FFFFFF

Use hex for Figma-specific colors:
- `#E6E6E6` (borders)
- `#F7F4EF` (modal background)
- `#2C8C3E` (progress green)
- `#999999` (indicators)

### Dependencies
- Only `lucide-react` (already installed)
- No additional dependencies needed

---

## Files to CREATE (2)

1. **`/app/components/SubmissionCarousel3D.tsx`** - 3D carousel with modal
2. **`/app/components/SubmissionCarousel3D.module.css`** - Carousel styles

## Files to MODIFY (6)

1. **`/app/components/LikeButton.tsx`** - Add `variant` prop
2. **`/app/components/LikeButton.module.css`** - Add variant styles
3. **`/app/components/SubmissionProgress.tsx`** - Add `variant` prop
4. **`/app/components/SubmissionProgress.module.css`** - Add inline variant
5. **`/app/chain/[id]/page.tsx`** - Add carousel, searchParams handling, conditional metadata
6. **`/app/submission/[id]/page.tsx`** - Convert to redirect

---

## PART 1: Component Updates

### 1A. Update LikeButton.tsx

**Add to props interface:**
```typescript
interface LikeButtonProps {
  submissionId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'small' | 'large';
  variant?: 'default' | 'floating' | 'inline';  // NEW
}
```

**Update function signature:**
```typescript
export default function LikeButton({
  submissionId,
  initialLiked = false,
  initialCount = 0,
  size = 'small',
  variant = 'default',  // NEW
}: LikeButtonProps) {
```

**Update button className:**
```typescript
<button
  onClick={handleToggleLike}
  disabled={loading || !address}
  className={`${styles.likeButton} ${size === 'large' ? styles.large : ''} ${loading ? styles.loading : ''} ${styles[variant]}`}  // Add variant
  ...
>
```

---

### 1B. Update LikeButton.module.css

**Add at end of file:**
```css
/* Variant: Floating (for carousel below center card) */
.floating {
  background-color: rgba(77, 77, 77, 0.1);
  border: 1px solid rgba(77, 77, 77, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 12px;
}

.floating:hover:not(:disabled) {
  background-color: rgba(77, 77, 77, 0.15);
}

.floating .heartFilled {
  fill: #ef4444;
  stroke: #ef4444;
}

.floating:hover:not(:disabled) .heartUnfilled {
  stroke: #ef4444;
}

/* Variant: Inline (for modal details row) */
.inline {
  padding: 0;
  min-width: auto;
  min-height: auto;
}

.inline .count {
  font-weight: 500;
}

.inline .heartFilled {
  fill: #ef4444;
  stroke: #ef4444;
}

.inline:hover:not(:disabled) .heartUnfilled {
  stroke: #ef4444;
}
```

---

### 2A. Update SubmissionProgress.tsx

**Add import:**
```typescript
import { Check } from 'lucide-react';
```

**Add to props:**
```typescript
interface SubmissionProgressProps {
  status: "awaiting_review" | "rejected" | "processing" | "complete";
  transactionId?: string;
  variant?: 'card' | 'inline';  // NEW
}
```

**Update function signature:**
```typescript
export default function SubmissionProgress({
  status,
  transactionId,
  variant = 'card',  // NEW
}: SubmissionProgressProps) {
```

**Update StepIcon for completed:**
```typescript
if (step.completed) {
  return (
    <div className={`${styles.stepIcon} ${styles.completed} ${variant === 'inline' ? styles.inline : ''}`}>
      <Check className={styles.checkIcon} strokeWidth={3} />
    </div>
  );
}
```

**Update container:**
```typescript
return (
  <div className={variant === 'card' ? styles.container : styles.containerInline}>
    {variant === 'card' && <h3 className={styles.title}>Progress Timeline</h3>}
    <div className={styles.progressTrack}>
      {/* ... existing steps ... */}
    </div>
  </div>
);
```

---

### 2B. Update SubmissionProgress.module.css

**Add at end:**
```css
/* Variant: Inline (for modal) */
.containerInline {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
}

.stepIcon.inline {
  width: 40px;
  height: 40px;
  border: 2px solid #E6E6E6;
}

.stepIcon.completed.inline {
  background-color: #2C8C3E;
  border-color: #2C8C3E;
  color: #F7F4EF;
}

.checkIcon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

.containerInline .connector {
  min-height: 3rem;
  width: 2px;
}

.containerInline .connectorCompleted {
  background-color: #2C8C3E;
}

.containerInline .connectorPending {
  background-color: #E6E6E6;
}

.containerInline .stepLabel {
  color: var(--brand-primary);
  font-size: 16px;
  transition: color 0.5s, opacity 0.5s;
}

.containerInline .stepContent {
  padding-top: 8px;
}

.containerInline .step:has(.stepIcon.pending) .stepLabel,
.containerInline .step:has(.stepIcon.current) .stepLabel {
  opacity: 0.5;
}

.containerInline .stepDescription {
  font-size: 12px;
  color: var(--brand-secondary-text);
  opacity: 0.7;
  margin-top: 4px;
}
```

---

## PART 2: Create Carousel Component

### 3. Create SubmissionCarousel3D.tsx

**Location**: `/app/components/SubmissionCarousel3D.tsx`

**Complete implementation:**

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, Share2, Clock, Check, X } from 'lucide-react';
import type { Submission } from '../lib/backendClient';
import { getImageUrl } from '../lib/backendClient';
import LikeButton from './LikeButton';
import SubmissionProgress from './SubmissionProgress';
import styles from './SubmissionCarousel3D.module.css';

interface SubmissionCarousel3DProps {
  submissions: Submission[];
  initialSubmissionId?: string;  // For auto-open from URL
}

export default function SubmissionCarousel3D({
  submissions,
  initialSubmissionId
}: SubmissionCarousel3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const DRAG_SENSITIVITY = 150;

  // Auto-open modal if initialSubmissionId provided
  useEffect(() => {
    if (initialSubmissionId) {
      const submission = submissions.find(s => s.id === initialSubmissionId);
      if (submission) {
        const index = submissions.indexOf(submission);
        setCurrentIndex(index);
        setSelectedSubmission(submission);
      }
    }
  }, [initialSubmissionId, submissions]);

  // 3D positioning calculation
  const getCardStyle = (index: number) => {
    let position = index - currentIndex;

    // Wrap around for circular effect
    if (position > submissions.length / 2) {
      position -= submissions.length;
    } else if (position < -submissions.length / 2) {
      position += submissions.length;
    }

    // Add drag influence
    const dragInfluence = dragOffset / DRAG_SENSITIVITY;
    position += dragInfluence;

    // 3D orbit configuration
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
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - startX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) > DRAG_SENSITIVITY) {
      if (dragOffset > 0) {
        setCurrentIndex((prev) => (prev - 1 + submissions.length) % submissions.length);
      } else {
        setCurrentIndex((prev) => (prev + 1) % submissions.length);
      }
    }
    setDragOffset(0);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Card click handler
  const handleCardClick = (submission: Submission, index: number) => {
    if (index === currentIndex) {
      setSelectedSubmission(submission);
    } else {
      setCurrentIndex(index);
    }
  };

  // Share handler
  const handleShare = async (submission: Submission) => {
    const url = `${window.location.origin}/chain/${submission.chainId}?submission=${submission.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
          text: submission.tagline || 'Check out this TouchGrass submission!',
          url: url,
        });
        return;
      } catch (err) {
        console.log('Web Share cancelled:', err);
      }
    }

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        return;
      } catch (err) {
        console.error('Clipboard failed:', err);
      }
    }

    alert(`Please copy: ${url}`);
  };

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedSubmission) {
        setSelectedSubmission(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubmission]);

  return (
    <>
      <div className={styles.carouselContainer}>
        <div className={styles.title}>Chain Images ({submissions.length})</div>

        <div
          ref={containerRef}
          className={styles.perspective}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.carousel}>
            {submissions.map((submission, index) => (
              <div
                key={submission.id}
                className={`${styles.card} ${index === currentIndex ? styles.cardActive : ''} ${isDragging ? styles.dragging : ''}`}
                style={getCardStyle(index)}
                onClick={() => handleCardClick(submission, index)}
              >
                <div className={styles.cardInner}>
                  <img
                    src={getImageUrl(submission.id)}
                    alt={submission.tagline || `Submission ${submission.chainPosition}`}
                    className={styles.cardImage}
                  />
                  {submission.status === 'processing' && (
                    <div className={styles.clockIcon}>
                      <Clock size={24} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.likeSection}>
          {submissions[currentIndex] && (
            <LikeButton
              submissionId={submissions[currentIndex].id}
              initialCount={submissions[currentIndex].likeCount}
              size="small"
              variant="floating"
            />
          )}
        </div>

        <div className={styles.indicators}>
          {submissions.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to submission ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {selectedSubmission && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSubmission(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedSubmission(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Submission Details</h2>
              <p className={styles.modalSubtitle}>View information about this submission</p>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.imagePreview}>
                <img
                  src={getImageUrl(selectedSubmission.id)}
                  alt={selectedSubmission.tagline || `Submission ${selectedSubmission.chainPosition}`}
                  className={styles.previewImage}
                />
              </div>

              {selectedSubmission.tagline && (
                <div className={styles.tagline}>{selectedSubmission.tagline}</div>
              )}

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <LikeButton
                    submissionId={selectedSubmission.id}
                    initialCount={selectedSubmission.likeCount}
                    size="small"
                    variant="inline"
                  />
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Position in Chain</span>
                  <span className={styles.detailValue}>#{selectedSubmission.chainPosition}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Date Created</span>
                  <span className={styles.detailValue}>
                    {new Date(selectedSubmission.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className={styles.progressSection}>
                <h3 className={styles.progressTitle}>Progress Timeline</h3>
                <SubmissionProgress
                  status={selectedSubmission.status}
                  transactionId={selectedSubmission.transactionId}
                  variant="inline"
                />
              </div>

              <button
                className={styles.shareButton}
                onClick={() => handleShare(selectedSubmission)}
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

### 4. Create SubmissionCarousel3D.module.css

**Location**: `/app/components/SubmissionCarousel3D.module.css`

**Complete styles (copy exactly):**

```css
/* Container */
.carouselContainer {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: var(--mina-white);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Title */
.title {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--brand-primary);
  font-family: 'Figtree', sans-serif;
  font-weight: bold;
  font-size: 13pt;
  z-index: 10;
}

/* 3D Perspective */
.perspective {
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1200px;
  perspective-origin: 50% 50%;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
}

.perspective:active {
  cursor: grabbing;
}

/* Carousel */
.carousel {
  position: relative;
  transform-style: preserve-3d;
}

/* Card */
.card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  margin-left: -150px;
  margin-top: -210px;
}

.card.dragging {
  transition: none !important;
}

.cardActive {
  cursor: pointer;
}

.cardInner {
  width: 300px;
  height: 420px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #1a1a1a;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid #E6E6E6;
  position: relative;
}

.cardActive .cardInner:hover {
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
}

.cardImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}

.cardInner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, transparent 40%);
  pointer-events: none;
}

/* Clock Icon */
.clockIcon {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Like Section */
.likeSection {
  position: absolute;
  bottom: 86px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: none;
}

.likeSection > * {
  pointer-events: auto;
}

/* Indicators */
.indicators {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%) scale(0.8);
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 24px;
  background-color: rgba(153, 153, 153, 0.1);
  border: 1px solid rgba(153, 153, 153, 0.2);
  backdrop-filter: blur(4px);
  z-index: 50;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(153, 153, 153, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}

.indicator:hover {
  background-color: rgba(153, 153, 153, 0.5);
}

.indicatorActive {
  width: 32px;
  background-color: #999999;
  border-radius: 12px;
}

/* Modal Overlay */
.modalOverlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal Content */
.modalContent {
  position: relative;
  width: 100%;
  max-width: 28rem;
  max-height: 90vh;
  background-color: #F7F4EF;
  border: 1px solid #E6E6E6;
  border-radius: 12px;
  overflow-y: auto;
  animation: zoomIn 0.2s ease;
  transform: scale(0.81);
  color: var(--brand-secondary-text);
}

@keyframes zoomIn {
  from {
    transform: scale(0.71);
    opacity: 0;
  }
  to {
    transform: scale(0.81);
    opacity: 1;
  }
}

.modalContent::-webkit-scrollbar {
  width: 8px;
}

.modalContent::-webkit-scrollbar-track {
  background: transparent;
}

.modalContent::-webkit-scrollbar-thumb {
  background: rgba(77, 77, 77, 0.2);
  border-radius: 4px;
}

/* Close Button */
.closeButton {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 8px;
  border-radius: 4px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.3s;
  color: var(--brand-secondary-text);
}

.closeButton:hover {
  opacity: 1;
  background-color: rgba(77, 77, 77, 0.1);
}

/* Modal Header */
.modalHeader {
  padding: 24px;
  padding-bottom: 8px;
  padding-top: 48px;
}

.modalTitle {
  font-size: 20px;
  color: var(--brand-primary);
  margin: 0;
  font-weight: 600;
  font-family: 'Figtree', sans-serif;
}

.modalSubtitle {
  color: var(--brand-secondary-text);
  margin: 4px 0 0 0;
  font-size: 14px;
  font-family: 'Figtree', sans-serif;
}

/* Modal Body */
.modalBody {
  padding: 0 24px 24px;
}

/* Image Preview */
.imagePreview {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  overflow: hidden;
  background-color: #E6E6E6;
  margin-bottom: 24px;
}

.previewImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Tagline */
.tagline {
  font-style: italic;
  color: var(--brand-primary);
  margin-bottom: 24px;
  padding: 0 4px;
  font-family: 'Figtree', sans-serif;
  font-size: 16px;
}

/* Details Grid */
.detailsGrid {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 24px;
}

.detailItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #E6E6E6;
}

.detailItem:last-child {
  border-bottom: none;
}

.detailLabel {
  color: var(--brand-secondary-text);
  font-size: 14px;
  font-family: 'Figtree', sans-serif;
}

.detailValue {
  font-weight: 500;
  color: var(--brand-primary);
  font-size: 14px;
  font-family: 'Figtree', sans-serif;
}

/* Progress Section */
.progressSection {
  margin-top: 32px;
  padding-top: 8px;
}

.progressTitle {
  color: var(--brand-primary);
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Figtree', sans-serif;
}

/* Share Button */
.shareButton {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-top: 24px;
  border-radius: 8px;
  background-color: rgba(77, 77, 77, 0.1);
  border: 1px solid rgba(77, 77, 77, 0.2);
  color: var(--brand-secondary-text);
  cursor: pointer;
  transition: background-color 0.3s;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  font-weight: 500;
}

.shareButton:hover {
  background-color: rgba(77, 77, 77, 0.15);
}

/* Responsive */
@media (max-width: 768px) {
  .modalContent {
    max-width: calc(100% - 2rem);
    max-height: 95vh;
  }

  .title {
    font-size: 11pt;
    top: 40px;
  }

  .cardInner {
    width: 250px;
    height: 350px;
  }

  .card {
    margin-left: -125px;
    margin-top: -175px;
  }
}
```

---

## PART 3: Update Chain Detail Page

### 5A. Update /app/chain/[id]/page.tsx

**Add searchParams to interface:**
```typescript
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submission?: string }>;  // ADD THIS
}
```

**Update generateMetadata:**
```typescript
export async function generateMetadata({
  params,
  searchParams  // ADD THIS
}: PageProps): Promise<Metadata> {
  try {
    const { id: chainId } = await params;
    const { submission: submissionId } = await searchParams;

    // If submission ID in query, generate submission-specific metadata
    if (submissionId) {
      const submission = await getSubmission(submissionId);
      const imageUrl = getImageUrl(submission.id);

      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'production'
        ? 'https://touchgrass-ui.vercel.app'
        : 'http://localhost:3000';

      const pageUrl = `${baseUrl}/chain/${chainId}?submission=${submissionId}`;
      const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;

      return {
        title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
        description: `Check out this submission! Position #${submission.chainPosition}.`,
        openGraph: {
          title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
          description: `Check out this submission! Position #${submission.chainPosition}.`,
          url: pageUrl,
          siteName: 'TouchGrass',
          images: [{
            url: absoluteImageUrl,
            width: 1200,
            height: 630,
            alt: submission.tagline || `TouchGrass submission #${submission.chainPosition}`,
          }],
          locale: 'en_US',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
          description: `Check out this submission! Position #${submission.chainPosition}.`,
          images: [absoluteImageUrl],
        },
      };
    }

    // Chain-level metadata (existing code)
    const chain = await getChain(chainId);
    return {
      title: `TouchGrass - ${chain.name}`,
      description: `View submissions in ${chain.name} challenge chain`,
    };
  } catch (error) {
    return {
      title: 'TouchGrass - Chain',
      description: 'View submissions in this challenge chain',
    };
  }
}
```

**Update component:**
```typescript
export default async function ChainDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { submission: initialSubmissionId } = await searchParams;

  return <ChainDetailClient params={params} initialSubmissionId={initialSubmissionId} />;
}
```

---

### 5B. Update /app/chain/[id]/ChainDetailClient.tsx (or inline if not separate)

**Add import:**
```typescript
import SubmissionCarousel3D from '../../components/SubmissionCarousel3D';
```

**Add prop:**
```typescript
interface ChainDetailClientProps {
  params: Promise<{ id: string }>;
  initialSubmissionId?: string;  // ADD THIS
}

export default function ChainDetailClient({ params, initialSubmissionId }: ChainDetailClientProps) {
```

**Replace grid with carousel:**
```typescript
// DELETE:
// <div className={styles.grid}>
//   {submissions.map((submission) => (
//     <SubmissionCard ... />
//   ))}
// </div>

// REPLACE WITH:
<SubmissionCarousel3D
  submissions={submissions}
  initialSubmissionId={initialSubmissionId}
/>
```

---

## PART 4: Update Submission Page to Redirect

### 6. Update /app/submission/[id]/page.tsx

**Replace entire file with redirect:**
```typescript
import { redirect } from 'next/navigation';
import { getSubmission } from '../../lib/backendClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionRedirectPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const submission = await getSubmission(id);
    redirect(`/chain/${submission.chainId}?submission=${id}`);
  } catch (error) {
    redirect('/challenges');
  }
}
```

---

## Testing Checklist

### Carousel Functionality
- [ ] Carousel renders with 3D positioning
- [ ] Cards arranged in circular orbit
- [ ] Center card is clearly visible
- [ ] Side cards fade and scale correctly
- [ ] Drag left advances carousel
- [ ] Drag right reverses carousel
- [ ] Touch swipe works on mobile
- [ ] Smooth transitions between cards
- [ ] Wraps around (circular behavior)

### Interactions
- [ ] Click center card opens modal
- [ ] Click side card navigates to it
- [ ] Indicator dots are clickable
- [ ] Indicator dots show current position
- [ ] ESC key closes modal
- [ ] Click outside modal closes it

### Like Button Variants
- [ ] Floating variant: appears below center card only
- [ ] Floating variant: circular button with backdrop blur
- [ ] Floating variant: red heart when filled (#ef4444)
- [ ] Inline variant: appears in modal details row
- [ ] Inline variant: minimal styling
- [ ] Inline variant: red heart when filled
- [ ] Count updates correctly in both locations
- [ ] Default variant still works elsewhere in app

### Progress Timeline (Inline Variant)
- [ ] No card container/border in modal
- [ ] Transparent background
- [ ] 40px circles with 2px border
- [ ] Correct colors (#2C8C3E green, #E6E6E6 gray)
- [ ] Check icon from lucide-react (not SVG)
- [ ] Connector lines correct color
- [ ] Pending steps are faded (opacity 0.5)
- [ ] Descriptions show correctly
- [ ] Correct stage for each status
- [ ] Card variant still works on submission detail page

### Modal
- [ ] Opens when clicking center card
- [ ] Closes when clicking X button
- [ ] Closes when clicking outside
- [ ] Closes on ESC key press
- [ ] Shows correct submission image
- [ ] Tagline displays if present
- [ ] Like count accurate
- [ ] Position number correct
- [ ] Date formatted properly
- [ ] Progress timeline shows correct stages
- [ ] Share button works

### URL & Sharing
- [ ] Share button creates `/chain/{chainId}?submission={id}` URL
- [ ] URL with `?submission=` auto-opens modal on page load
- [ ] Auto-opened modal shows correct submission
- [ ] `/submission/[id]` redirects to chain with query param
- [ ] OpenGraph preview shows submission image
- [ ] OpenGraph title shows submission tagline
- [ ] Twitter card works correctly
- [ ] Shared link opens with modal visible

### Visual Accuracy
- [ ] Matches Figma carousel design
- [ ] Matches Figma modal design
- [ ] Correct colors (CSS variables where possible)
- [ ] Correct fonts and sizes
- [ ] Correct spacing
- [ ] Backdrop blur works
- [ ] Shadows match design
- [ ] Clock icon shows for in-progress only

### Responsive
- [ ] Works on mobile (< 768px)
- [ ] Cards resize appropriately
- [ ] Modal fits on small screens
- [ ] Touch interactions smooth
- [ ] Indicator dots visible

### Backward Compatibility
- [ ] Existing LikeButton usages work (default variant)
- [ ] Existing SubmissionProgress usages work (card variant)
- [ ] No regressions on other pages
- [ ] Chain detail page metadata still works for chain-level

### Performance
- [ ] No jank during drag
- [ ] Smooth 60fps animations
- [ ] Images load efficiently
- [ ] Modal scroll is smooth
- [ ] No console errors

---

## Implementation Order

1. **Update LikeButton** (15 min)
   - Add variant prop
   - Add CSS styles

2. **Update SubmissionProgress** (20 min)
   - Add variant prop
   - Import Check icon
   - Add CSS styles

3. **Create SubmissionCarousel3D** (60 min)
   - Create component file
   - Create CSS file
   - Test carousel interaction

4. **Update Chain Detail Page** (30 min)
   - Add searchParams handling
   - Update generateMetadata
   - Replace grid with carousel

5. **Update Submission Page** (10 min)
   - Convert to redirect

6. **Testing** (45 min)
   - Complete testing checklist
   - Fix any issues

---

## Time Estimate

- Component updates: 35 min
- Carousel creation: 60 min
- Page updates: 40 min
- Testing: 45 min

**Total: ~3 hours**

---

## Success Criteria

✅ Carousel fully functional with 3D positioning and drag/touch interaction
✅ Modal opens on center card click with all submission details
✅ Share URLs use query parameters and generate correct metadata
✅ Social previews show submission-specific images
✅ Existing components support new variants without breaking
✅ Matches Figma design exactly
✅ Works on mobile and desktop
✅ No additional dependencies installed
