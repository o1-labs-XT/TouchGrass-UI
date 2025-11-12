# Submission Likes Feature - Implementation Plan

## Overview
Add ability for users to like submissions with a **green heart icon**, displaying the like count. Users can like from both the chain grid view and submission detail page.

## User Requirements
- **Location**: Both chain grid view AND submission detail page
- **Auth**: All users have wallet (generated or Auro), no special handling needed
- **Display**: Show count next to heart (e.g., "💚 42")
- **Icon**: **Green heart** icon - filled when liked, unfilled when not liked
- **Color**: Use brand green (#2C8C3E) to match TouchGrass theme

## API Endpoints

### POST /submissions/{submissionId}/likes
Create a like for a submission.

**Request Body:**
```json
{
  "walletAddress": "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhQMqbgy"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "submissionId": "550e8400-e29b-41d4-a716-446655440001",
  "walletAddress": "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhQMqbgy",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- 400: Invalid wallet address format
- 403: User must have an admin-approved submission before liking
- 404: Submission or user not found
- 409: Like already exists

### GET /submissions/{submissionId}/likes
Get all likes for a submission.

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "submissionId": "550e8400-e29b-41d4-a716-446655440001",
    "walletAddress": "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhQMqbgy",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### GET /submissions/{submissionId}/likes/count
Get total like count for a submission.

**Response (200):**
```json
{
  "submissionId": "550e8400-e29b-41d4-a716-446655440001",
  "count": 42
}
```

### DELETE /submissions/{submissionId}/likes/{walletAddress}
Remove a like from a submission.

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- 404: Like not found

## Implementation Steps

### 1. Add Backend API Functions
**File**: `app/lib/backendClient.ts`

Add Like interface:
```typescript
export interface Like {
  id: string;
  submissionId: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}
```

Add 4 new functions:
```typescript
export async function likeSubmission(
  submissionId: string,
  walletAddress: string
): Promise<Like>

export async function unlikeSubmission(
  submissionId: string,
  walletAddress: string
): Promise<void>

export async function getLikeCount(
  submissionId: string
): Promise<{ submissionId: string; count: number }>

export async function checkUserLiked(
  submissionId: string,
  walletAddress: string
): Promise<boolean>
```

### 2. Create LikeButton Component
**New File**: `app/components/LikeButton.tsx`
**New File**: `app/components/LikeButton.module.css`

**Component Features:**
- Green heart SVG icon (filled/unfilled based on liked state)
- Show count next to heart
- Handle click to toggle like/unlike
- Loading state during API call
- Optimistic updates (immediate UI feedback, rollback on error)
- Error handling with user-friendly messages
- Use `useWallet()` hook to get wallet address
- Mobile-friendly: 44x44px minimum tap target
- Heart animation on like/unlike
- Remove webkit tap highlight

**Props:**
```typescript
interface LikeButtonProps {
  submissionId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'small' | 'large';
}
```

**Colors:**
- Filled heart: #2C8C3E (brand green)
- Unfilled heart: #4D4D4D (text muted gray)
- Hover: Slightly lighter green
- Count text: #003712 (brand primary)

### 3. Integrate into Chain Grid View
**File**: `app/chain/[id]/page.tsx`

**Changes:**
```typescript
import LikeButton from '../../components/LikeButton';

// In submission card render:
<SubmissionCard>
  <LikeButton
    submissionId={submission.id}
    size="small"
  />
  {/* existing card content */}
</SubmissionCard>
```

**Positioning:**
- Top-right or bottom-right corner of card
- Absolute positioning with padding
- z-index to ensure it's above image

### 4. Integrate into Submission Detail Page
**File**: `app/submission/[id]/SubmissionDetailClient.tsx`

**Changes:**
```typescript
import LikeButton from '../../components/LikeButton';

// In metadata section or below image:
<div className={styles.likeSection}>
  <LikeButton
    submissionId={submission.id}
    size="large"
  />
</div>
```

### 5. Styling Guidelines

**CSS Variables to Use:**
- `--brand-primary: #003712`
- `--color-text-muted: #4D4D4D`
- `--font-figtree: 'Figtree', sans-serif`

**Heart Icon Styling:**
```css
.heart {
  width: 1.5rem; /* small */
  height: 1.5rem;
  transition: all 0.2s ease;
}

.heartLarge {
  width: 2rem;
  height: 2rem;
}

.heartFilled {
  fill: #2C8C3E;
  stroke: #2C8C3E;
}

.heartUnfilled {
  fill: none;
  stroke: #4D4D4D;
  stroke-width: 2;
}

.heart:hover {
  transform: scale(1.1);
}

.heart:active {
  transform: scale(0.95);
}
```

**Button Styling:**
```css
.likeButton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  min-width: 44px;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}
```

### 6. Error Handling

**Error Messages:**
```typescript
const ERROR_MESSAGES = {
  403: "You need an approved submission before you can like others",
  404: "This submission could not be found",
  409: "You've already liked this submission",
  network: "Network error. Please check your connection and try again",
  default: "Something went wrong. Please try again"
};
```

**Error Display:**
- Show toast notification at top of screen
- Auto-dismiss after 3 seconds
- Red background (#DC2626)
- White text

### 7. Optimistic Updates

**Like Flow:**
1. User clicks heart
2. Immediately update UI (fill heart, increment count)
3. Send API request in background
4. If success: Keep UI state
5. If error: Rollback UI, show error message

**Unlike Flow:**
1. User clicks filled heart
2. Immediately update UI (unfill heart, decrement count)
3. Send API request in background
4. If success: Keep UI state
5. If error: Rollback UI, show error message

## Testing Checklist

- [ ] Heart toggles correctly on click
- [ ] Heart shows green when liked, gray when not
- [ ] Count updates immediately (optimistic)
- [ ] Count syncs with server
- [ ] 403 error shows friendly message
- [ ] Works on mobile (tap targets are large enough)
- [ ] Animation is smooth
- [ ] Multiple rapid clicks handled correctly (debounce)
- [ ] Liked state persists across page navigation
- [ ] Works on both grid view and detail page
- [ ] Loading state shows during API call
- [ ] Error states are user-friendly
- [ ] No webkit tap highlight appears

## Files Modified/Created

**New Files:**
- `app/components/LikeButton.tsx`
- `app/components/LikeButton.module.css`
- `LIKES_IMPLEMENTATION.md`

**Modified Files:**
- `app/lib/backendClient.ts`
- `app/chain/[id]/page.tsx`
- `app/submission/[id]/SubmissionDetailClient.tsx`

## Commit Strategy

1. **Commit 1**: Add Like interface and API functions to backendClient
   - Message: "Add likes API functions to backend client"

2. **Commit 2**: Create LikeButton component with green heart styling
   - Message: "Create LikeButton component with green heart"

3. **Commit 3**: Integrate LikeButton into chain grid view
   - Message: "Add like button to chain grid view"

4. **Commit 4**: Integrate LikeButton into submission detail page
   - Message: "Add like button to submission detail page"

5. **Commit 5**: Add error handling and polish
   - Message: "Add error handling and animations to like button"

## Future Enhancements

- [ ] Show list of users who liked a submission
- [ ] Add notification when someone likes your submission
- [ ] Add "Most Liked" filter/sort option
- [ ] Add analytics for like patterns
- [ ] Cache like states in localStorage for offline viewing
