# Wallet Generation Timing - Implementation Plan

**Status:** Not Started - Separate PR Required
**Priority:** High (blocks users from liking until first submission)
**Date:** 2025-10-28
**Related:** Likes Feature PR #26

---

## Problem Statement

### Current Behavior
Users who choose "Continue without wallet" on the welcome page do NOT receive a generated Mina keypair until they submit their first photo. This creates a critical user experience issue:

1. User lands on welcome page → clicks "Continue without wallet"
2. User navigates to challenges → sees submissions → tries to like a submission
3. **Like fails** because `useWallet()` returns `address: null` (no wallet exists yet)
4. User must submit their first photo before they can like anything

### Root Cause
**File:** `app/submit/page.tsx` (lines 178-196)

```typescript
// This code runs ONLY during first photo submission
if (!keypairData) {
  setStatus("Generating Mina keypair...");
  console.log("[5/7] Generating Mina keypair for first use");
  const minaKeypair = await worker.generateKeypair();
  sessionStorage.setItem(
    "minaKeypair",
    JSON.stringify({
      privateKey: minaKeypair.privateKey,
      publicKey: minaKeypair.publicKey
    })
  );
  keypairData = JSON.stringify(minaKeypair);
}
```

**Impact:** Users with `walletChoice: "generated"` have no `address` until after first submission, which breaks the likes feature and any other feature requiring a wallet address.

---

## Proposed Solution

### Move Wallet Generation to Welcome Page

**When:** User clicks "Continue without wallet" button
**Why:** Ensures all users have a wallet address immediately, enabling likes, future features (comments, profile, leaderboards, etc.)

### Implementation Strategy

#### 1. Update Welcome Page (`app/page.tsx`)

**Changes needed:**
- Import `TouchGrassWorkerClient`
- Add loading state for keypair generation
- Check if keypair already exists (returning users)
- Generate keypair on "Continue without wallet" click
- Store in sessionStorage before navigating to /challenges
- Show "Generating wallet..." button text during generation
- Handle errors gracefully (retry on submit if needed)

**Estimated LOC:** +30 lines

#### 2. Update WalletContext (`app/contexts/WalletContext.tsx`)

**Current problem:** Context only exposes Auro wallet address, not generated wallet address

**Changes needed:**
- Add state for `generatedAddress: string | null`
- Add useEffect to load generated wallet address from sessionStorage when `walletChoice === "generated"`
- Parse `minaKeypair` from sessionStorage and extract `publicKey`
- Override `address` in context value when walletChoice is "generated"
- Override `isConnected: true` when generated address exists

**Estimated LOC:** +20 lines

**Critical fix:** This ensures `useWallet()` returns valid `address` for generated wallets, not just Auro wallets.

#### 3. Simplify Submit Page (`app/submit/page.tsx`)

**Changes needed (lines 178-196):**
- Remove "first time" wallet generation logic
- Always load from sessionStorage (should exist now)
- Add warning if sessionStorage is empty (shouldn't happen)
- Fallback: generate on-the-fly if missing (defensive programming)

**Result:** Simpler code, faster submissions, no "Generating Mina keypair..." step

---

## Detailed Implementation

### Step 1: Welcome Page Changes

```typescript
// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// ... existing imports

export default function WelcomePage() {
  const router = useRouter();
  const { setWalletChoice } = useWallet();
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);

  // ... handleAuroWallet stays the same

  const handleWithoutWallet = async () => {
    setWalletChoice("generated");

    // Check if keypair already exists (returning user)
    const existingKeypair = sessionStorage.getItem("minaKeypair");
    if (existingKeypair) {
      router.push("/challenges");
      return;
    }

    // Generate keypair for new users
    setIsGeneratingWallet(true);
    try {
      const TouchGrassWorkerClient = (await import("./TouchGrassWorkerClient")).default;
      const worker = new TouchGrassWorkerClient();

      const minaKeypair = await worker.generateKeypair();
      sessionStorage.setItem(
        "minaKeypair",
        JSON.stringify({
          privateKey: minaKeypair.privateKey,
          publicKey: minaKeypair.publicKey,
        })
      );

      router.push("/challenges");
    } catch (err) {
      console.error("Failed to generate wallet:", err);
      // Still navigate - will retry on submit if needed
      router.push("/challenges");
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  return (
    // ... existing JSX
    <GrassyButton
      variant="secondary"
      onClick={handleWithoutWallet}
      disabled={isGeneratingWallet}
    >
      {isGeneratingWallet ? "Generating wallet..." : "Continue without wallet"}
    </GrassyButton>
  );
}
```

**Error Handling:**
- Try-catch around generation
- Navigate even on failure (defensive)
- Submit page has fallback generation

**Performance:**
- Web Worker keeps UI responsive
- Typical generation time: 500-1000ms
- Button shows loading state

### Step 2: WalletContext Changes

```typescript
// app/contexts/WalletContext.tsx
export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletChoice, setWalletChoiceState] = useState<WalletChoice>(null);
  const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
  const auroWallet = useAuroWallet();

  // Load walletChoice from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('walletChoice');
    if (stored === 'auro' || stored === 'generated') {
      setWalletChoiceState(stored);
    }
  }, []);

  // Load generated wallet address when walletChoice is 'generated'
  useEffect(() => {
    if (walletChoice === 'generated') {
      const keypairData = sessionStorage.getItem('minaKeypair');
      if (keypairData) {
        try {
          const keypair = JSON.parse(keypairData);
          setGeneratedAddress(keypair.publicKey);
        } catch (err) {
          console.error('Failed to parse minaKeypair:', err);
          setGeneratedAddress(null);
        }
      }
    } else {
      setGeneratedAddress(null);
    }
  }, [walletChoice]);

  const setWalletChoice = (choice: 'auro' | 'generated') => {
    sessionStorage.setItem('walletChoice', choice);
    setWalletChoiceState(choice);
  };

  const value = {
    walletChoice,
    setWalletChoice,
    ...(walletChoice === 'generated'
      ? {
          // For generated wallet, override with generated address
          ...auroWallet,
          address: generatedAddress,
          isConnected: !!generatedAddress,
        }
      : auroWallet), // For Auro wallet, use actual Auro wallet state
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
```

**Key Points:**
- Second useEffect watches `walletChoice`
- Parses sessionStorage only when `walletChoice === "generated"`
- Overrides `address` and `isConnected` for generated wallets
- Clears `generatedAddress` when switching to Auro

**Type Safety:**
- `generatedAddress` is `string | null` (matches `address` type)
- `isConnected` becomes `true` when address exists
- No TypeScript errors

### Step 3: Simplify Submit Page

```typescript
// app/submit/page.tsx (lines 176-216)
// After determining walletChoice === "generated"

// Load generated keypair (should always exist now)
const keypairData = sessionStorage.getItem("minaKeypair");

if (!keypairData) {
  // This shouldn't happen anymore, but defensive programming
  console.warn("[WARN] No minaKeypair found in sessionStorage, generating now");
  setStatus("Generating Mina keypair...");
  const minaKeypair = await worker.generateKeypair();
  sessionStorage.setItem(
    "minaKeypair",
    JSON.stringify({
      privateKey: minaKeypair.privateKey,
      publicKey: minaKeypair.publicKey
    })
  );
  keypairData = JSON.stringify(minaKeypair);
}

const minaKeypair = JSON.parse(keypairData);

setStatus("Signing with generated keypair...");
const fieldMessage = [commitment.high128String, commitment.low128String];
const signResult = await worker.signFieldsMinaSigner(
  minaKeypair.privateKey,
  fieldMessage
);

walletSignResult = { signature: signResult.signature };
minaPublicKey = signResult.publicKey;
```

**Changes:**
- Removed "First submit" comment (no longer true)
- Added warning if keypair missing (defensive)
- Simplified logic flow
- Faster submissions (no generation step)

---

## Testing Plan

### Manual Testing

#### Test Case 1: New User Flow
1. Clear sessionStorage and cookies
2. Visit welcome page
3. Click "Continue without wallet"
4. **Expect:** Button shows "Generating wallet..." for ~500ms
5. **Expect:** Navigate to /challenges after generation
6. Open DevTools → Application → Session Storage
7. **Verify:** `minaKeypair` exists with `privateKey` and `publicKey`
8. **Verify:** `walletChoice` === "generated"
9. Navigate to chain view
10. **Verify:** Like buttons are enabled (not grayed out)
11. Click a like button
12. **Expect:** Heart fills green, count increments
13. Open Network tab → Verify POST to `/submissions/{id}/likes` with `walletAddress`
14. **Verify:** walletAddress matches publicKey from sessionStorage

#### Test Case 2: Returning User Flow
1. Don't clear sessionStorage (minaKeypair exists)
2. Visit welcome page
3. Click "Continue without wallet"
4. **Expect:** Navigate immediately (no "Generating wallet..." state)
5. **Expect:** No web worker call (check console)
6. **Verify:** Can like submissions immediately

#### Test Case 3: Auro Wallet Flow (Not Affected)
1. Clear sessionStorage
2. Click "Connect Wallet & Start Playing"
3. Connect Auro wallet
4. **Verify:** No generated keypair in sessionStorage
5. **Verify:** `address` comes from Auro wallet
6. **Verify:** Likes work with Auro address

#### Test Case 4: Error Handling
1. Clear sessionStorage
2. Simulate worker failure (disconnect network, corrupt worker)
3. Click "Continue without wallet"
4. **Expect:** Still navigate to /challenges (doesn't block user)
5. Try to like a submission
6. **Expect:** Like button might be disabled OR shows error
7. Submit a photo
8. **Expect:** Submit page generates keypair as fallback
9. **Verify:** After submit, likes work

#### Test Case 5: First Photo Submission (After Wallet Generation)
1. Complete Test Case 1 (new user, wallet generated)
2. Navigate to submit page
3. Capture and submit photo
4. **Verify:** No "Generating Mina keypair..." status message
5. **Verify:** Submission faster (~1 second less)
6. Check console logs
7. **Verify:** No "[5/7] Generating Mina keypair" log
8. **Verify:** "[5/7] Signing with generated keypair" appears immediately

### Edge Cases

#### Edge Case 1: Multiple Tabs
1. Open two tabs, clear sessionStorage
2. Tab 1: Click "Continue without wallet"
3. While generating, Tab 2: Click "Continue without wallet"
4. **Expected:** Both should generate or one should detect the other's result
5. **Potential issue:** Race condition, two keypairs generated
6. **Solution:** Add timestamp check or mutex (future enhancement)

#### Edge Case 2: Session Storage Full
1. Fill sessionStorage to quota limit
2. Click "Continue without wallet"
3. **Expected:** Catch storage error, still navigate
4. **Expected:** Fallback to submit-time generation

#### Edge Case 3: Invalid Keypair in Storage
1. Manually corrupt `minaKeypair` in sessionStorage: `{"privateKey": "invalid"}`
2. Click "Continue without wallet"
3. **Expected:** Parse succeeds but address is invalid
4. Try to like a submission
5. **Expected:** API rejects invalid signature
6. **Solution:** Add validation in WalletContext (future enhancement)

#### Edge Case 4: Browser Compatibility
- Test in Safari (iOS, desktop)
- Test in Chrome (Android, desktop)
- Test in Firefox
- **Verify:** Web Worker works in all browsers
- **Verify:** sessionStorage persists across navigation

### Performance Testing

1. **Measure generation time:**
   - Desktop Chrome: ~300-500ms
   - Mobile Chrome: ~800-1200ms
   - Desktop Safari: ~400-600ms
   - Mobile Safari: ~1000-1500ms

2. **Measure impact on welcome page:**
   - Without generation: Instant navigation
   - With generation: Add 0.5-1.5s delay
   - **Acceptable:** Yes, one-time cost for new users

3. **Measure submit page improvement:**
   - Before: 7 steps, ~4-6 seconds total
   - After: 6 steps, ~3-5 seconds total
   - **Improvement:** 1 second faster submissions

### Automated Testing (Future)

```typescript
// Example test
describe('Welcome Page - Wallet Generation', () => {
  it('should generate wallet on "Continue without wallet" click', async () => {
    sessionStorage.clear();
    const { getByText } = render(<WelcomePage />);
    const button = getByText('Continue without wallet');

    fireEvent.click(button);

    expect(getByText('Generating wallet...')).toBeInTheDocument();

    await waitFor(() => {
      const keypair = sessionStorage.getItem('minaKeypair');
      expect(keypair).toBeTruthy();
      expect(JSON.parse(keypair!)).toHaveProperty('publicKey');
      expect(JSON.parse(keypair!)).toHaveProperty('privateKey');
    });
  });

  it('should skip generation for returning users', async () => {
    sessionStorage.setItem('minaKeypair', JSON.stringify({
      privateKey: 'existing-key',
      publicKey: 'existing-public-key'
    }));

    const { getByText, queryByText } = render(<WelcomePage />);
    const button = getByText('Continue without wallet');

    fireEvent.click(button);

    expect(queryByText('Generating wallet...')).not.toBeInTheDocument();
  });
});
```

---

## Risks and Mitigations

### Risk 1: Slow Wallet Generation Blocks User
**Severity:** Medium
**Likelihood:** Low
**Impact:** User waits 1-2 seconds on welcome page
**Mitigation:**
- Show clear loading state ("Generating wallet...")
- Web Worker keeps UI responsive
- Error handling allows navigation even on failure
- Future: Pre-generate in background before button click

### Risk 2: Race Condition in Multiple Tabs
**Severity:** Low
**Likelihood:** Very Low
**Impact:** Two different keypairs generated, one gets overwritten
**Mitigation:**
- Most users don't open multiple tabs simultaneously
- Last write wins (acceptable for MVP)
- Future: Use localStorage with timestamps and mutex

### Risk 3: Session Storage Cleared by User
**Severity:** Low
**Likelihood:** Low
**Impact:** User loses wallet, can't access previous likes/submissions
**Mitigation:**
- Document in settings: "Don't clear browser data"
- Future: Backend wallet recovery via email/phone
- Future: Warn user before clearing data

### Risk 4: Web Worker Failure
**Severity:** Medium
**Likelihood:** Very Low
**Impact:** Wallet generation fails, user can't like
**Mitigation:**
- Try-catch with graceful error handling
- Fallback to submit-time generation
- Console warnings for debugging
- Future: Retry logic with exponential backoff

### Risk 5: Invalid Keypair Format
**Severity:** Low
**Likelihood:** Very Low
**Impact:** Signatures fail, submissions/likes rejected
**Mitigation:**
- Keypair generated by proven TouchGrassWorkerClient
- Same code that works on submit page
- Future: Add validation in WalletContext

---

## Migration Strategy

### For Existing Users (Already Have Generated Wallets)
**No action needed.** Existing users already have `minaKeypair` in sessionStorage from their first submission. They'll skip wallet generation at welcome page.

### For New Users (After This PR Merges)
**New flow applies.** First-time users get wallet generated at welcome page, can like immediately.

### Backwards Compatibility
**100% compatible.** Submit page keeps fallback generation logic (defensive programming). If sessionStorage is somehow empty, submit page generates wallet as before.

---

## Implementation Checklist

- [ ] Update `app/page.tsx`
  - [ ] Import useState and TouchGrassWorkerClient
  - [ ] Add isGeneratingWallet state
  - [ ] Implement handleWithoutWallet with generation logic
  - [ ] Update button to show loading state
  - [ ] Add error handling
- [ ] Update `app/contexts/WalletContext.tsx`
  - [ ] Add generatedAddress state
  - [ ] Add useEffect to load generated address
  - [ ] Override address/isConnected for generated wallets
  - [ ] Add error handling for JSON.parse
- [ ] Update `app/submit/page.tsx`
  - [ ] Remove "first time" generation logic
  - [ ] Add warning if keypair missing
  - [ ] Keep fallback generation (defensive)
- [ ] Test manually (all test cases above)
- [ ] Create PR with description
- [ ] Test on Vercel preview deployment
- [ ] Verify mobile testing (iOS Safari, Android Chrome)
- [ ] Merge to main
- [ ] Monitor for issues

---

## Estimated Effort

- **Development:** 1-2 hours
- **Testing:** 1-2 hours
- **PR review:** 30 minutes
- **Total:** 3-5 hours

---

## Alternative Solutions Considered

### Alternative 1: Generate Wallet in Background on Welcome Page Load
**Pros:**
- Zero perceived delay when clicking "Continue without wallet"
- User doesn't wait at all

**Cons:**
- Wastes resources for users who choose Auro wallet
- Generates wallet even if user doesn't click button (closes tab, etc.)
- More complex: Need to track generation state, handle user clicking before generation completes

**Decision:** Rejected - Optimize for most common path (Auro wallet), don't waste resources

### Alternative 2: Keep Current Behavior, Show "Submit First to Like" Message
**Pros:**
- Zero code changes
- Simple

**Cons:**
- Poor UX - users confused why they can't like
- Reduces engagement (users might not submit just to like)
- Doesn't scale to other features (comments, leaderboards, etc.)

**Decision:** Rejected - UX is too poor

### Alternative 3: Backend-Generated Wallets
**Pros:**
- Instant, no client-side delay
- Backend can manage wallets centrally

**Cons:**
- Backend has private keys (huge security risk)
- Defeats purpose of self-custody
- Requires backend migration
- More complex infrastructure

**Decision:** Rejected - Security risk too high, against Web3 principles

---

## Success Metrics

### Primary Metrics
- **Time to first like (new users):** Should decrease from "∞" (can't like) to ~3-5 seconds (welcome → challenges → like)
- **Like engagement rate:** Should increase by 20-50% (users can like before submitting)
- **Bounce rate:** Should decrease (users can engage immediately)

### Secondary Metrics
- **Welcome page exit rate:** Monitor for increase (users might leave during wallet generation)
- **Submit page time:** Should decrease by ~1 second (no generation step)
- **Error rate:** Monitor wallet generation failures

### Health Metrics
- **Web Worker errors:** Should be <0.1%
- **Invalid signature errors:** Should remain constant (unchanged logic)
- **Session storage errors:** Should be <0.01%

---

## Future Enhancements

### Phase 2: Wallet Recovery
- Allow users to export/import private keys
- Email/phone-based recovery
- Multi-device sync

### Phase 3: Hardware Wallet Support
- Ledger integration
- Mobile wallet apps (MetaMask, Coinbase Wallet)

### Phase 4: Wallet Analytics
- Track wallet generation success rate
- Monitor generation time across devices
- A/B test background generation

---

## Related Documentation

- **Likes Feature:** `LIKES_FEATURE_STATUS.md`
- **Wallet Context:** `app/contexts/WalletContext.tsx`
- **Submit Flow:** `app/submit/page.tsx`
- **Web Worker:** `app/TouchGrassWorkerClient.ts`
- **Backend API:** `SWAGGER_DOCS_V4_LIKES.md`

---

## Questions for Product/Design

1. **Loading State:** Should we show a spinner/animation during wallet generation, or just text?
2. **Error Handling:** If wallet generation fails, should we show an error message or silently fall back?
3. **Returning Users:** Should we show "Welcome back!" message for users with existing wallets?
4. **Mobile:** Is 1-2 second delay acceptable on mobile for new users?
5. **Analytics:** What metrics should we track for wallet generation success/failure?

---

## Critical Analysis (Self-Criticism)

### What Could Go Wrong?

1. **User Experience:**
   - ❌ Users might not understand why they're waiting on welcome page
   - ❌ "Generating wallet..." might sound technical/scary to non-crypto users
   - ✅ Mitigation: Better copy ("Setting up your account..."), animation/spinner

2. **Technical Debt:**
   - ❌ sessionStorage is not persistent (cleared when tab closes)
   - ❌ Users lose wallet if they clear browser data
   - ✅ Future: Move to localStorage or IndexedDB for persistence

3. **Edge Cases:**
   - ❌ What if user clicks "Continue without wallet" multiple times rapidly?
   - ❌ What if generation takes >5 seconds on slow device?
   - ✅ Mitigation: Disable button during generation, add timeout

4. **Security:**
   - ❌ Private keys stored in sessionStorage (not encrypted)
   - ❌ Vulnerable to XSS attacks
   - ✅ Same risk as current implementation, future: encrypted storage

5. **Performance:**
   - ❌ Web Worker might block on low-end devices
   - ❌ Mobile generation time might be unacceptable (1-2s)
   - ✅ Mitigation: Show clear progress, consider background generation

### False Assumptions?

1. **Assumption:** Users want to like before submitting
   - **Challenge:** Maybe users prefer to submit first, then explore
   - **Validation:** Check analytics for browse-before-submit vs submit-first patterns

2. **Assumption:** 1-2 second delay is acceptable
   - **Challenge:** Users might abandon during generation
   - **Validation:** A/B test with/without generation, measure drop-off

3. **Assumption:** Web Worker is fast enough
   - **Challenge:** Low-end devices might take 3-5 seconds
   - **Validation:** Test on older iPhones (iPhone 7, 8) and Android (Samsung A series)

4. **Assumption:** Fallback generation on submit is sufficient
   - **Challenge:** If welcome page generation fails, submit page might also fail
   - **Validation:** Add retry logic, exponential backoff

### Better Alternatives?

1. **Lazy Wallet Generation:**
   - Generate wallet only when user first tries to like/submit/interact
   - Pros: No welcome page delay, generates only when needed
   - Cons: Delay moved to first interaction (worse UX at like/submit time)

2. **Backend Assigns Temporary Anonymous ID:**
   - Backend creates temporary user ID on first visit
   - Converts to wallet on first submit
   - Pros: Instant likes, no generation delay
   - Cons: Complex migration, users might lose likes when converting to wallet

3. **Optional Wallet Generation:**
   - "Continue without wallet" → Skip generation entirely
   - Show "Generate wallet to like/submit" prompt in-app
   - Pros: No forced delay
   - Cons: Extra friction, users might not generate wallet

**Decision:** Stick with proposed solution (generate on welcome page) - best balance of UX and simplicity.

---

**Last Updated:** 2025-10-28
**Next Steps:** Review with team, create separate PR after likes feature merges
