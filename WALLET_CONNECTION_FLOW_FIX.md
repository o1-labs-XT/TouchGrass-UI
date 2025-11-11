# Wallet Connection Flow Fix - Verified Analysis

**Date:** 2025-10-28
**Branch:** `feature/wallet-connection-flow`
**Status:** Ready to implement

---

## The Core Problem

**Users with generated wallets cannot like submissions until after first photo submission**

### Root Cause
- WalletContext only exposes Auro wallet address
- Generated wallet public key never added to context
- Keypair generation happens too late (on first submit, not on welcome page flow)

---

## Current State - Verified Against Code

### ✅ Auro Wallet Flow (WORKS)

**File:** `app/hooks/useAuroWallet.ts`

**Flow:**
1. Welcome page: User clicks "Connect Wallet" → set `walletChoice = "auro"` in sessionStorage → navigate to `/challenges`
2. `/challenges` page loads → `useAuroWallet` hook mounts
3. **Line 36:** `useEffect` runs
4. **Line 63:** Checks `sessionStorage.getItem('walletChoice')`
5. **Line 66:** If `walletChoice === 'auro'`, **auto-connects immediately**
6. **Lines 88-95:** Calls `window.mina.getAccounts()` or `window.mina.requestAccounts()`
7. **Line 105:** Sets `address = accounts[0]` (Auro wallet address)
8. **Result:** `useWallet().address` returns Auro wallet address immediately

**File:** `app/contexts/WalletContext.tsx`

**Line 44:** `...auroWallet` spreads all Auro wallet state including `address`

**✅ Auro users CAN like immediately after connection succeeds**

---

### ❌ Generated Wallet Flow (BROKEN)

**File:** `app/hooks/useAuroWallet.ts`

**Flow:**
1. Welcome page: User clicks "Continue without wallet" → set `walletChoice = "generated"` → navigate to `/challenges`
2. `/challenges` page loads → `useAuroWallet` hook mounts
3. **Line 36:** `useEffect` runs
4. **Line 63:** Checks `sessionStorage.getItem('walletChoice')`
5. **Line 66:** `walletChoice !== 'auro'`, so **SKIPS auto-connect**
6. **Line 72:** Returns early with `address: null`
7. **Result:** `useWallet().address` returns `null`

**File:** `app/contexts/WalletContext.tsx`

**Line 44:** Only spreads `...auroWallet`, which has `address: null`
**Problem:** No parallel logic to expose generated wallet address

**File:** `app/submit/page.tsx`

**Lines 178-196:** First photo submission triggers keypair generation
```typescript
let keypairData = sessionStorage.getItem("minaKeypair");

if (!keypairData) {
  // First submit - generate and store
  const minaKeypair = await worker.generateKeypair();
  sessionStorage.setItem("minaKeypair", JSON.stringify({
    privateKey: minaKeypair.privateKey,
    publicKey: minaKeypair.publicKey
  }));
  keypairData = JSON.stringify(minaKeypair);
}
```

**❌ Generated users CANNOT like until after first photo submission**

---

## The Three Problems

### Problem 1: No Keypair Generation Before Likes Needed
- Auro: Auto-connects on `/challenges` load
- Generated: No equivalent generation on `/challenges` load
- Keypair only generated in `submit/page.tsx:184` (first submission)

### Problem 2: Generated Address Not Exposed in Context
- WalletContext only spreads `auroWallet` (line 44)
- No logic to expose generated wallet's public key
- Even if keypair exists in sessionStorage, context doesn't read it

### Problem 3: Uses sessionStorage Instead of localStorage
- `sessionStorage.setItem("minaKeypair", ...)` at `submit/page.tsx:186`
- Keypair lost when tab closes
- Need to regenerate on every new session
- Poor user experience

---

## The Fix

### Change 1: WalletContext - Add Generated Wallet State

**File:** `app/contexts/WalletContext.tsx`

**Add state:**
```typescript
const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
```

**Add useEffect to generate/load wallet:**
```typescript
useEffect(() => {
  if (walletChoice === 'generated') {
    const keypairData = localStorage.getItem('minaKeypair');

    if (keypairData) {
      // Load existing keypair
      try {
        const keypair = JSON.parse(keypairData);
        setGeneratedAddress(keypair.publicKey);
      } catch (err) {
        console.error('Failed to parse minaKeypair:', err);
      }
    } else {
      // Generate new keypair
      generateKeypair();
    }
  }
}, [walletChoice]);

async function generateKeypair() {
  try {
    const TouchGrassWorkerClient = (await import('./TouchGrassWorkerClient')).default;
    const worker = new TouchGrassWorkerClient();

    const minaKeypair = await worker.generateKeypair();
    localStorage.setItem('minaKeypair', JSON.stringify({
      privateKey: minaKeypair.privateKey,
      publicKey: minaKeypair.publicKey
    }));

    setGeneratedAddress(minaKeypair.publicKey);
  } catch (err) {
    console.error('Failed to generate keypair:', err);
  }
}
```

**Update context value to expose generated address:**
```typescript
const value = {
  walletChoice,
  setWalletChoice,
  ...(walletChoice === 'generated'
    ? {
        ...auroWallet,
        address: generatedAddress,
        isConnected: !!generatedAddress,
      }
    : auroWallet),
};
```

### Change 2: Update All References from sessionStorage to localStorage

**Files to update:**
- `app/contexts/WalletContext.tsx` - Change `sessionStorage` to `localStorage` (2 places)
- `app/submit/page.tsx:178` - Change `sessionStorage.getItem("minaKeypair")` to `localStorage.getItem("minaKeypair")`
- `app/submit/page.tsx:186` - Change `sessionStorage.setItem("minaKeypair", ...)` to `localStorage.setItem("minaKeypair", ...)`

### Change 3: Simplify Submit Page (Remove Redundant Generation)

**File:** `app/submit/page.tsx` (lines 178-196)

**Current:**
```typescript
let keypairData = sessionStorage.getItem("minaKeypair");

if (!keypairData) {
  // Generate keypair
}
```

**After fix:**
```typescript
// Keypair should already exist from WalletContext
const keypairData = localStorage.getItem("minaKeypair");

if (!keypairData) {
  // This shouldn't happen, but defensive programming
  console.warn("No keypair found - user may need to refresh");
  throw new Error("Wallet not ready. Please refresh and try again.");
}
```

**Why:** Context already generates keypair, so this should always exist. Keep defensive check for edge cases.

---

## Implementation Steps (Small Commits)

### Commit 1: Add generated wallet state to WalletContext
- Add `generatedAddress` state
- Add `useEffect` to load existing keypair from localStorage
- Don't generate yet, just load if exists

### Commit 2: Add keypair generation logic to WalletContext
- Add `generateKeypair` function
- Call it when no existing keypair found

### Commit 3: Update context value to expose generated address
- Conditional spread based on `walletChoice`
- Override `address` and `isConnected` for generated wallets

### Commit 4: Change sessionStorage to localStorage (WalletContext)
- Update both read and write calls

### Commit 5: Change sessionStorage to localStorage (submit page)
- Update both read and write calls

### Commit 6: Simplify submit page wallet logic
- Remove redundant generation
- Add defensive error handling

### Commit 7: Test the flow
- Test generated wallet: Can like before first submission
- Test Auro wallet: Still works as before
- Test localStorage persistence: Survives tab close

---

## Verification Checklist

### Generated Wallet Flow (After Fix)
- [ ] User clicks "Continue without wallet"
- [ ] Navigate to `/challenges` instantly
- [ ] WalletContext generates keypair in background (~500-1500ms)
- [ ] User browses challenges while generation happens
- [ ] User clicks challenge → clicks "View Chain"
- [ ] Like buttons enabled (address available)
- [ ] User can like submissions before first photo submission
- [ ] Close tab → reopen → keypair persists (localStorage)

### Auro Wallet Flow (Should Not Change)
- [ ] User clicks "Connect Wallet"
- [ ] Auro wallet connection happens
- [ ] User can like submissions
- [ ] No generated keypair created
- [ ] Everything works as before

---

## Edge Cases Not Yet Handled

These are known but out of scope for this PR:

1. **User switches from generated to Auro**
   - Generated keypair remains in localStorage
   - Auro wallet takes precedence (walletChoice determines which is used)
   - Future: Add "Switch Wallet" UI

2. **User switches from Auro to generated**
   - If they already have generated keypair from previous use, it's loaded
   - If not, new keypair is generated
   - Future: Warn user about wallet switch

3. **localStorage cleared mid-session**
   - User loses keypair
   - Cannot recover previous likes/submissions
   - Future: Backup to backend or show warning

4. **Multiple tabs with different wallets**
   - localStorage is shared across tabs
   - Last write wins
   - Future: Add tab synchronization

---

## Files Modified

1. `app/contexts/WalletContext.tsx` - Add generated wallet logic
2. `app/submit/page.tsx` - Change sessionStorage → localStorage, simplify

## Files Not Modified

- `app/page.tsx` - Welcome page stays simple (just routing)
- `app/hooks/useAuroWallet.ts` - Auro logic unchanged
- All other files

---

## Key Insights

1. **Auro flow already works** - Auto-connects on page load via `useEffect`
2. **Generated wallet needs parallel logic** - Same auto-generation on page load
3. **WalletContext is the right place** - Parallel to how Auro wallet works
4. **localStorage is better** - Keypair persists across sessions
5. **Keep changes minimal** - Don't touch working Auro code

---

**Last Updated:** 2025-10-28
**Next Step:** Implement in small commits, test each change
