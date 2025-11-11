# Likes Feature - Implementation Status

**PR:** #26 - Add submission likes feature with green heart
**Branch:** `feature/likes`
**Status:** ✅ Complete - Ready for Testing
**Date:** 2025-10-28

## Summary

Implemented ability for users to like submissions with a **green heart icon**, displaying the like count. Users can like from both the chain grid view and submission detail page. All code complete, TypeScript errors fixed, ready for testing.

## What Was Completed

### 1. Backend API Integration
**File:** `app/lib/backendClient.ts`

Added Like interface and 4 API functions:
- `Like` interface (id, submissionId, walletAddress, createdAt, updatedAt)
- `likeSubmission(submissionId, walletAddress)` - POST /submissions/{id}/likes
- `unlikeSubmission(submissionId, walletAddress)` - DELETE /submissions/{id}/likes/{walletAddress}
- `getLikeCount(submissionId)` - GET /submissions/{id}/likes/count
- `checkUserLiked(submissionId, walletAddress)` - GET /submissions/{id}/likes

**Commits:**
1. Add Like interface to backend client
2. Add likeSubmission function
3. Add unlikeSubmission function
4. Add getLikeCount and checkUserLiked functions

### 2. LikeButton Component
**Files:**
- `app/components/LikeButton.tsx`
- `app/components/LikeButton.module.css`

**Features:**
- Green heart icon (#2C8C3E) when liked, gray (#4D4D4D) when not liked
- Displays like count next to heart
- Two sizes: `small` (24px, for grid) and `large` (32px, for detail page)
- Optimistic updates (immediate UI feedback, rollback on error)
- Error handling with user-friendly messages:
  - 403: "You need an approved submission before you can like others"
  - 404: "This submission could not be found"
  - 409: "You've already liked this submission"
  - Network: "Something went wrong. Please try again"
- Heart animation on like/unlike (scale 1 → 1.2 → 1)
- Mobile-friendly: 48x48px minimum tap targets on mobile
- Removed webkit tap highlight (transparent)
- Uses `useWallet()` hook for automatic wallet address detection
- Error toast auto-dismisses after 3 seconds

**Commit:** Create LikeButton component with green heart

### 3. Chain Grid Integration
**Files:**
- `app/chain/[id]/page.tsx` - Added LikeButton import and component
- `app/chain/[id]/ChainDetail.module.css` - Added positioning styles

**Changes:**
- LikeButton positioned in top-right corner (absolute position)
- `.likeButtonContainer` with `position: absolute; top: 0.5rem; right: 0.5rem; z-index: 10`
- Uses `size="small"` prop
- Each submission card gets its own like button

**Commit:** Add like button to chain grid view

### 4. Submission Detail Integration
**Files:**
- `app/submission/[id]/SubmissionDetailClient.tsx` - Added LikeButton import and component
- `app/submission/[id]/SubmissionDetail.module.css` - Added like section styles

**Changes:**
- LikeButton positioned below image, centered
- `.likeSection` with centered flex layout, border top/bottom, padding
- Uses `size="large"` prop
- Prominent placement for engagement

**Commit:** Add like button to submission detail page

### 5. TypeScript Fix
**File:** `app/components/LikeButton.tsx`

Fixed type error where `address` from `useWallet()` is `string | null`:
- Added non-null assertions (`address!`) after null checks
- Fixed in `fetchLikeData()` function (line 35)
- Fixed in `handleToggleLike()` function (lines 62, 64)

**Commit:** Fix TypeScript error in LikeButton address handling

## Design Specifications

### Colors
- **Liked heart:** #2C8C3E (brand green)
- **Unliked heart:** #4D4D4D (text muted gray)
- **Hover liked:** #238735 (darker green)
- **Hover unliked:** #2C8C3E (brand green)
- **Count text:** var(--brand-primary) #003712
- **Error toast:** #DC2626 (red)

### Typography
- **Font:** var(--font-figtree) 'Figtree', sans-serif
- **Count size small:** 0.875rem (14px)
- **Count size large:** 1.125rem (18px)
- **Count weight:** 600

### Sizing
- **Small heart:** 24px × 24px (grid view)
- **Large heart:** 32px × 32px (detail page)
- **Button tap target:** 44px × 44px minimum (48px on mobile)
- **Gap between heart and count:** 0.5rem

### Animations
- **Heart pop:** 0.3s ease animation on like (scale 1 → 1.2 → 1)
- **Button hover:** scale(1.05) with 0.2s ease
- **Button active:** scale(0.95)
- **Error toast fade:** 0.2s ease fade in

## API Endpoints Used

### Like a Submission
```
POST /submissions/{submissionId}/likes
Body: { walletAddress: string }
Response: Like object
Errors: 400, 403, 404, 409
```

### Unlike a Submission
```
DELETE /submissions/{submissionId}/likes/{walletAddress}
Response: void
Errors: 404
```

### Get Like Count
```
GET /submissions/{submissionId}/likes/count
Response: { submissionId: string, count: number }
Errors: 404
```

### Check User Liked
```
GET /submissions/{submissionId}/likes
Response: Like[]
Errors: 404
```

## Files Modified/Created

### New Files
- `app/components/LikeButton.tsx` (131 lines)
- `app/components/LikeButton.module.css` (130 lines)
- `LIKES_IMPLEMENTATION.md` (full documentation, not committed)
- `LIKES_FEATURE_STATUS.md` (this file, not committed)

### Modified Files
- `app/lib/backendClient.ts` (+87 lines)
  - Added Like interface
  - Added 4 like API functions
- `app/chain/[id]/page.tsx` (+4 lines)
  - Imported LikeButton
  - Added LikeButton to each submission card
- `app/chain/[id]/ChainDetail.module.css` (+6 lines)
  - Added `.likeButtonContainer` positioning
- `app/submission/[id]/SubmissionDetailClient.tsx` (+4 lines)
  - Imported LikeButton
  - Added LikeButton in like section
- `app/submission/[id]/SubmissionDetail.module.css` (+8 lines)
  - Added `.likeSection` styling

## Commits in PR #26

Total: 8 commits

1. `f3d7856` Add Like interface to backend client
2. `d79a316` Add likeSubmission function
3. `e06a024` Add unlikeSubmission function
4. `f211ba3` Add getLikeCount and checkUserLiked functions
5. `b1980cf` Create LikeButton component with green heart
6. `0934111` Add like button to chain grid view
7. `8af7635` Add like button to submission detail page
8. `860f253` Fix TypeScript error in LikeButton address handling

## Testing Checklist

### Functionality
- [ ] Like button appears in chain grid view (top-right corner)
- [ ] Like button appears in submission detail page (centered below image)
- [ ] Heart shows gray when not liked
- [ ] Heart shows green when liked
- [ ] Count displays correctly next to heart
- [ ] Clicking unliked heart fills it green and increments count
- [ ] Clicking liked heart unfills it gray and decrements count
- [ ] Optimistic update happens immediately
- [ ] Changes persist after page refresh

### Error Handling
- [ ] 403 error shows "You need an approved submission before you can like others"
- [ ] Error toast auto-dismisses after 3 seconds
- [ ] Failed like/unlike rolls back UI state
- [ ] Multiple rapid clicks are handled correctly

### Mobile Testing
- [ ] Tap targets are large enough (no missed taps)
- [ ] No webkit tap highlight appears on tap
- [ ] Heart animation is smooth
- [ ] Error toast is readable on small screens
- [ ] Works on iPhone (Safari and Chrome)
- [ ] Works on Android (Chrome)

### Desktop Testing
- [ ] Hover effects work correctly
- [ ] Heart scales on hover
- [ ] Cursor changes to pointer on hover
- [ ] Animations are smooth
- [ ] Works in Chrome, Firefox, Safari

### Edge Cases
- [ ] Works when user has no wallet address (button disabled)
- [ ] Works with generated wallet address
- [ ] Works with Auro wallet address
- [ ] Handles network errors gracefully
- [ ] Handles submissions with 0 likes
- [ ] Handles submissions with many likes (999+)

## Known Issues

### 1. Users Can't Like Until First Submission (Wallet Generation Timing)
**Severity:** High
**Status:** Will be fixed in separate PR (see WALLET_IMPROVEMENTS.md)

**Problem:** Users who choose "Continue without wallet" on the welcome page do NOT have a wallet address available until they submit their first photo. This means:
- `useWallet()` returns `address: null` before first submission
- Like button is disabled (grayed out) because `!address` check fails
- Users must submit a photo before they can like other submissions

**Root Cause:** Mina keypair generation happens in `app/submit/page.tsx:178-196` during first photo submission, not at welcome page.

**Workaround:** None - users must submit their first photo to get a wallet address.

**Fix:** Addressed in `WALLET_IMPROVEMENTS.md` - move wallet generation to welcome page in a separate PR. This PR intentionally does NOT include wallet generation changes to keep the scope focused on likes feature only.

**Impact on Testing:** When testing likes feature:
- **Auro wallet users:** Can like immediately (wallet connected at welcome page)
- **Generated wallet users:** Must submit first photo, THEN can like (current limitation)

### 2. No Other Known Issues
TypeScript errors fixed, all code compiles successfully.

## Current State

### Development Server
- **Status:** Running on http://localhost:3000
- **Network:** http://10.0.0.78:3000
- **Ngrok:** May have existing tunnels running (check with `ngrok status`)

### Branch Status
- **Branch:** feature/likes
- **Pushed:** Yes, all 8 commits pushed to GitHub
- **PR:** #26 created and updated
- **Vercel:** Build should pass, preview deployment available

### Backend Status
- **Backend API:** Running (npm run dev:api)
- **Database:** Seeded with test data
- **Endpoints:** All likes endpoints available at /api/submissions/{id}/likes

## How to Test

### Local Testing
```bash
# Frontend (should already be running)
npm run dev
# Visit http://localhost:3000

# Backend (should already be running)
npm run dev:api
# API at http://localhost:3001
```

### Mobile Testing
```bash
# Start ngrok (if not already running)
ngrok http 3000

# Visit ngrok URL on mobile device
# Navigate to chain view to see like buttons
# Tap a submission to see detail page with large like button
```

### Test Flow
1. **Navigate to chain view** (`/chain/{chainId}`)
   - Should see green/gray hearts in top-right of each submission card
   - Should see like counts next to hearts
2. **Click/tap a heart**
   - Should fill green immediately (or unfill to gray)
   - Count should increment/decrement immediately
   - Check network tab - API call should complete
3. **Navigate to submission detail** (click a submission)
   - Should see large heart centered below image
   - Click to like/unlike
   - Should see smooth animation
4. **Test error case** (if possible)
   - Try liking with unapproved user
   - Should see friendly error message

## Next Steps

### If PR Approved
1. Merge PR #26 to main
2. Delete feature/likes branch
3. Verify Vercel production deployment
4. Test on production URL
5. Monitor for any issues
6. **Important:** Create follow-up PR for wallet generation timing fix (see WALLET_IMPROVEMENTS.md)

### If Changes Needed
All code is modular and easy to update:
- **Colors:** Edit `LikeButton.module.css` lines 34-42
- **Sizes:** Edit `LikeButton.tsx` SVG width/height props
- **Positioning:** Edit `ChainDetail.module.css` or `SubmissionDetail.module.css`
- **Error messages:** Edit `LikeButton.tsx` lines 71-80
- **API endpoints:** Edit `backendClient.ts` functions

### Future Enhancements
- [ ] **Priority 1:** Fix wallet generation timing (see WALLET_IMPROVEMENTS.md) - enables likes before first submission
- [ ] Show list of users who liked a submission
- [ ] Add notification when someone likes your submission
- [ ] Add "Most Liked" filter/sort option
- [ ] Add analytics for like patterns
- [ ] Cache like states in localStorage for offline viewing
- [ ] Add like button to other views (profile, explore, etc.)

## Important Context

### Why Green Heart?
User requested green heart to match TouchGrass brand theme instead of traditional red heart.

### Why Two Sizes?
- Small (24px) for grid view to not overwhelm submission cards
- Large (32px) for detail page for prominent engagement

### Why Optimistic Updates?
Better UX - users see immediate feedback instead of waiting for API response. If API fails, state rolls back and error is shown.

### Why Non-Null Assertions?
The `useWallet()` hook returns `address: string | null`, but we always check `if (!address)` before using it. TypeScript non-null assertion (`address!`) tells compiler "I know this is not null here" after the check.

### Why Separate API Functions?
Better separation of concerns - each function does one thing. Easier to test, maintain, and reuse.

## Related Documentation

- **PR #26:** Add submission likes feature with green heart
- **LIKES_IMPLEMENTATION.md:** Full implementation plan (not committed)
- **WALLET_IMPROVEMENTS.md:** Fix for wallet generation timing issue (separate PR)
- **Git history:** Check commits f3d7856 through 860f253 for implementation details
- **This file:** Current status and testing checklist

---

## Critical Self-Assessment

### What Could Go Wrong?

#### 1. API Performance Issues
**Risk:** Fetching like count and user-liked state on EVERY submission card load could create N+1 query problem
- **Scenario:** Chain view with 50 submissions = 100 API calls (50x getLikeCount + 50x checkUserLiked)
- **Impact:** Slow page load, backend overload, poor mobile performance
- **Mitigation needed:** Backend should return like data WITH submission data (single query), OR implement request batching
- **Current state:** LikeButton makes 2 API calls per submission - NOT scalable

#### 2. Optimistic Update Race Conditions
**Risk:** If user clicks like/unlike rapidly, optimistic updates could get out of sync with backend
- **Scenario:** User clicks heart 3 times rapidly → Multiple POST/DELETE requests in flight
- **Impact:** Final UI state might not match backend state (count incorrect, heart wrong color)
- **Mitigation:** Debounce clicks, queue requests, OR refresh state after all requests complete
- **Current state:** No debouncing or queueing - rapid clicks could break

#### 3. Stale Like Counts
**Risk:** Like counts are fetched once on mount, never refreshed
- **Scenario:** User A likes submission → User B (already viewing same submission) sees old count
- **Impact:** Inaccurate engagement metrics shown to users
- **Mitigation needed:** Polling, websockets, OR manual refresh button
- **Current state:** No refresh mechanism - counts become stale immediately

#### 4. Mobile Network Performance
**Risk:** Each like button makes 2 API calls on mount (getLikeCount + checkUserLiked)
- **Scenario:** User on slow 3G views chain with 20 submissions → 40 API calls
- **Impact:** Long loading times, timeouts, poor UX
- **Mitigation needed:** Backend API consolidation, request batching, or aggressive caching
- **Current state:** No optimization for slow networks

#### 5. Error Handling Gaps
**Risk:** Only handles specific error codes (403, 404, 409), generic fallback for others
- **Scenario:** Network timeout, 500 server error, CORS issue, etc.
- **Impact:** Users see unhelpful "Something went wrong" message
- **Mitigation:** More granular error handling, retry logic, offline detection
- **Current state:** Basic error handling only

#### 6. Authentication State Drift
**Risk:** User's wallet address could change mid-session (switching wallets, clearing storage)
- **Scenario:** User generates wallet → likes submissions → clears sessionStorage → likes more submissions
- **Impact:** Likes associated with wrong wallet, user can't unlike previous likes
- **Mitigation:** Detect wallet changes, refresh like states, warn user
- **Current state:** No wallet change detection

#### 7. Accessibility Issues
**Risk:** Heart icon might not be clear to screen reader users
- **Scenario:** Visually impaired user navigating with screen reader
- **Impact:** "Like submission" / "Unlike submission" might not convey current state clearly
- **Mitigation:** Add aria-pressed, aria-label with count, announce state changes
- **Current state:** Basic aria-label only, no state announcements

### False Assumptions Made

#### Assumption 1: Users will always have wallet address when liking
**Reality:** Users with "Continue without wallet" have no address until first submission
**Impact:** Like buttons disabled for most new users
**Fix:** WALLET_IMPROVEMENTS.md addresses this

#### Assumption 2: Backend API is fast enough for multiple calls per submission
**Reality:** Unknown - not tested with production data volume
**Risk:** Could be slow with hundreds of submissions

#### Assumption 3: Optimistic updates are always better UX
**Reality:** If API frequently fails, constant rollbacks are worse than loading states
**Risk:** Users lose trust in feature if it "jumps around" frequently

#### Assumption 4: Like counts < 1000 fit in UI
**Reality:** What if a submission gets 10,000 likes? Or 1,000,000?
**Risk:** UI breaks, number truncation needed (1.5K, 1.5M format)
**Current state:** No number formatting

#### Assumption 5: sessionStorage is reliable
**Reality:** Users clear storage, use incognito mode, browser bugs
**Risk:** Wallet address disappears mid-session, likes break
**Mitigation:** Handle missing address gracefully (already done: disable button)

#### Assumption 6: Users understand green heart = TouchGrass brand
**Reality:** Users expect red heart (universal like symbol)
**Risk:** Confusion, lower engagement because icon meaning unclear
**Validation needed:** User testing, analytics

### What Wasn't Tested

- [ ] Like counts > 999 (UI layout with large numbers)
- [ ] Rapid clicking (10+ clicks per second)
- [ ] Network timeouts (slow 3G, airplane mode)
- [ ] Multiple users liking same submission simultaneously
- [ ] Backend API with 100+ submissions in chain (performance)
- [ ] Screen reader navigation and announcements
- [ ] Keyboard navigation (tab to like button, space/enter to activate)
- [ ] Dark mode (if app has dark mode - colors might not work)
- [ ] Submissions with 0 likes (does UI show "0" correctly?)
- [ ] Users switching between Auro and generated wallets mid-session

### Better Alternatives Considered?

#### Alternative 1: Server-Side Rendering (SSR) for Like Data
**Pros:**
- Faster initial page load (data pre-fetched)
- No client-side API calls on mount
- Better SEO (like counts visible to crawlers)

**Cons:**
- More complex implementation
- Harder to show user-specific state (which ones user liked)
- Cache invalidation complexity

**Decision:** Rejected for MVP - client-side simpler

#### Alternative 2: Batch API Endpoint
**Example:** `POST /submissions/batch-likes` with array of submission IDs
**Pros:**
- Single API call for all submissions on page
- Much better performance
- Reduces backend load

**Cons:**
- Requires new backend endpoint
- More complex client-side state management

**Decision:** Should be next priority after wallet fix

#### Alternative 3: Include Like Data in Submission Response
**Example:** Backend adds `likeCount` and `userLiked` fields to Submission object
**Pros:**
- Zero additional API calls
- Optimal performance
- Simplest implementation

**Cons:**
- Requires backend schema change
- All submission endpoints need updating
- Migration complexity

**Decision:** Best long-term solution, should be proposed

### Technical Debt Created

1. **LikeButton makes 2 API calls per instance** - Should be consolidated
2. **No request batching or caching** - Leads to redundant calls
3. **No real-time updates** - Like counts become stale
4. **No optimistic update queue** - Rapid clicks could break
5. **Error messages hardcoded in component** - Should be i18n-ready
6. **No loading skeleton** - Uses disabled button instead (less clear)
7. **No retry logic** - Network blips require manual refresh
8. **Non-null assertions used** (`address!`)** - TypeScript bandaid, not real fix

### Questions That Need Answers

1. **Backend Performance:** Can backend handle 100+ like count queries per page load?
2. **Scalability:** What happens when app has 10,000 daily active users all liking?
3. **Analytics:** Should we track like/unlike actions for product metrics?
4. **Monetization:** Could "likes" be premium feature or used for ranking?
5. **Moderation:** Should there be limits (max likes per user per day)?
6. **Privacy:** Should like lists be public or private?
7. **Gamification:** Should users earn points/badges for likes received?

### Recommended Follow-Up Work (Priority Order)

1. **Priority 1 (CRITICAL):** Wallet generation timing fix (WALLET_IMPROVEMENTS.md)
2. **Priority 2 (HIGH):** Backend API consolidation - return like data WITH submissions
3. **Priority 3 (HIGH):** Request batching or single batch endpoint for multiple submissions
4. **Priority 4 (MEDIUM):** Debounce/queue like/unlike actions to prevent race conditions
5. **Priority 5 (MEDIUM):** Add number formatting for large like counts (1K, 1M, etc.)
6. **Priority 6 (MEDIUM):** Real-time updates or manual refresh button
7. **Priority 7 (LOW):** Loading skeletons instead of disabled buttons
8. **Priority 8 (LOW):** Retry logic for failed requests
9. **Priority 9 (LOW):** Accessibility improvements (aria-pressed, state announcements)
10. **Priority 10 (LOW):** Analytics tracking for like engagement

---

**Last Updated:** 2025-10-28
**Next Engineer:**
1. Read this entire document, especially "Critical Self-Assessment" section
2. Review WALLET_IMPROVEMENTS.md for context on known limitation
3. Test locally with focus on edge cases listed above
4. Consider backend API optimization before merging to production
5. Plan follow-up PRs for critical technical debt items
