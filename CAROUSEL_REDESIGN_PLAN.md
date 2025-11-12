# Chain Detail Carousel Redesign - Implementation Plan

## Overview
This document outlines the changes needed to update the chain detail page carousel to match the new Figma design (example-figma-v2).

## Design Changes Summary

### Current Design (Image #1)
- Status tooltip (Clock icon): TOP RIGHT of carousel cards
- Like button: BELOW carousel cards (only on center card)
- No extend chain button

### New Design (Image #2)
- Status tooltip (Clock icon): TOP LEFT of carousel cards
- Like button: TOP RIGHT of carousel cards (on ALL visible cards)
- Extend chain button: BOTTOM CENTER (green circular button with plus icon, only on center card)

## Files to Modify

### 1. `/app/components/SubmissionCarousel3D.module.css`
### 2. `/app/components/SubmissionCarousel3D.tsx`
### 3. `/app/chain/[id]/ChainDetailClient.tsx`

---

## Phase 1: Move Status Tooltip from TOP RIGHT → TOP LEFT

### File: `SubmissionCarousel3D.module.css`

**Line 145-173: Update `.statusButton` positioning**

```css
/* BEFORE */
.statusButton {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;  /* ← Change this */
  /* ... rest stays same */
}

/* AFTER */
.statusButton {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;  /* ← Changed from right to left */
  /* ... rest stays same */
}
```

### File: `SubmissionCarousel3D.tsx`

**Line 367: Update tooltip side direction**

```tsx
/* BEFORE */
<TooltipContent side="left">

/* AFTER */
<TooltipContent side="right">
```

**Reason**: Tooltip was on right side, so it opened to the left. Now button is on left side, so tooltip should open to the right.

---

## Phase 2: Move Like Button to TOP RIGHT of ALL Cards

### File: `SubmissionCarousel3D.module.css`

**Remove old `.likeButton` CSS** (lines 87-112) - this positioned button below card

**Add new `.likeButtonOnCard` CSS** - positions button on top-right of card

```css
/* Like button on card - positioned top right */
.likeButtonOnCard {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  /* No need for width/height/display - LikeButton component handles this */
  z-index: 10;
  pointer-events: auto;
}
```

### File: `SubmissionCarousel3D.tsx`

**Current structure (lines 332-395):**
```tsx
{submissions.map((submission, index) => (
  <div className={styles.cardPositioner} style={getCardStyle(index)}>
    <div className={styles.card}>
      {/* Image */}
      {/* Status button (top right, moving to top left) */}
    </div>

    {/* Like button OUTSIDE card - only shows on center */}
    {index === currentIndex && (
      <LikeButton ... />
    )}
  </div>
))}
```

**New structure:**
```tsx
{submissions.map((submission, index) => (
  <div className={styles.cardPositioner} style={getCardStyle(index)}>
    <div className={styles.card}>
      {/* Image */}
      {/* Status button (now top LEFT) */}

      {/* Like button INSIDE card - shows on ALL cards */}
      <div className={styles.likeButtonOnCard}>
        <LikeButton
          submissionId={submission.id}
          initialCount={submission.likeCount}
          variant="carousel"
          size="small"
          onCountChange={(newCount) => handleLikeCountChange(submission.id, newCount)}
        />
      </div>
    </div>

    {/* Extend chain button will go here (Phase 3) */}
  </div>
))}
```

**Key changes:**
1. **Remove** `{index === currentIndex &&` conditional wrapper around LikeButton
2. **Move** LikeButton INSIDE the `.card` div (after status button)
3. **Wrap** LikeButton in `<div className={styles.likeButtonOnCard}>` for positioning
4. **Keep** all LikeButton props the same

---

## Phase 3: Add Extend Chain Button

### File: `SubmissionCarousel3D.module.css`

**Add new `.extendChainButton` CSS:**

```css
/* Extend chain button - green circular button below center card */
.extendChainButton {
  position: absolute;
  bottom: -86px;  /* Same position as old like button */
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  background-image: url('/assets/grassy-button-plus-primary.svg');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  border: none;
  cursor: pointer;
  z-index: 50;
  pointer-events: auto;
  transition: background-image 300ms ease-out;
  -webkit-tap-highlight-color: transparent;
}

.extendChainButton:hover {
  background-image: url('/assets/grassy-button-plus-primary-hover.svg');
}

.extendChainButton:active {
  transform: translateX(-50%) scale(0.98);
}
```

### File: `SubmissionCarousel3D.tsx`

**Line 1: Add router import**
```tsx
import { useRouter } from 'next/navigation';
```

**Line 12: Update interface to accept chainId**
```tsx
interface SubmissionCarousel3DProps {
  submissions: Submission[];
  initialSubmissionId?: string;
  chainId: string;  // ← Add this
}
```

**Line 32: Extract chainId from props**
```tsx
export default function SubmissionCarousel3D({
  submissions: initialSubmissions,
  initialSubmissionId,
  chainId  // ← Add this
}: SubmissionCarousel3DProps) {
  const router = useRouter();  // ← Add this
```

**After the closing `</div>` of `.card`, add extend chain button (only for center card):**

```tsx
{/* Extend Chain Button - Only show for center image */}
{index === currentIndex && (
  <button
    onClick={() => router.push(`/submit?chainId=${chainId}`)}
    className={styles.extendChainButton}
    aria-label="Extend chain"
  />
)}
```

### File: `ChainDetailClient.tsx`

**Line 101: Pass chainId to SubmissionCarousel3D**

```tsx
/* BEFORE */
<SubmissionCarousel3D submissions={submissions} initialSubmissionId={initialSubmissionId} />

/* AFTER */
<SubmissionCarousel3D
  submissions={submissions}
  initialSubmissionId={initialSubmissionId}
  chainId={chainId}
/>
```

**Note**: `chainId` is already available in ChainDetailClient state (line 21)

---

## Assets Required

The following SVG files have already been added to `/public/assets/`:
- ✅ `grassy-button-plus-primary.svg` (default state)
- ✅ `grassy-button-plus-primary-hover.svg` (hover state)

---

## Testing Checklist

After implementation, verify:

### Visual Position
- [ ] Status tooltip (clock icon) is on TOP LEFT of carousel cards
- [ ] Like button (heart icon) is on TOP RIGHT of ALL visible carousel cards
- [ ] Extend chain button (green with plus) is BELOW center card only

### Interactions
- [ ] Status tooltip still opens and shows correct information
- [ ] Status tooltip opens to the RIGHT (not left)
- [ ] Like button works on ALL cards (not just center)
- [ ] Like count updates correctly across all instances
- [ ] Extend chain button navigates to `/submit?chainId={chainId}`
- [ ] Extend chain button shows hover state

### Drag & Click
- [ ] Buttons don't interfere with carousel drag gestures
- [ ] Button clicks don't trigger card click (modal open)
- [ ] All `e.stopPropagation()` calls still work

### Mobile
- [ ] All buttons are appropriately sized for touch targets
- [ ] Buttons don't overlap on smaller screens
- [ ] Extend chain button visible on mobile (not cut off)

---

## Implementation Order

1. **Phase 1** (Independent): Move status tooltip position
2. **Phase 2** (Independent): Move like button to cards
3. **Phase 3** (Depends on Phase 2 being tested): Add extend chain button
4. **Testing**: Verify all interactions work correctly

---

## Rollback Plan

If issues arise, changes can be reverted in reverse order:

1. Remove extend chain button changes
2. Revert like button position (move back outside card with conditional)
3. Revert status tooltip position

Each phase is isolated and can be rolled back independently.
