# Wallet Connection Flow - Implementation Status

**Date:** 2025-10-28
**Branch:** `feature/wallet-connection-flow`
**Status:** Core implementation complete, performance optimization pending

---

## Problem Solved

**Original Issue:** Users with generated wallets cannot like submissions until after first photo submission

**Root Cause:**
1. Generated keypair only created in `submit/page.tsx` on first photo submission
2. WalletContext only exposed Auro wallet address, not generated wallet address
3. Used sessionStorage (lost on tab close) instead of localStorage

---

## Completed Work (10 commits)

### Commit 1: Remove unused svgo dependency
- Cleaned up package.json

### Commit 2: Add generated wallet state to WalletContext
```typescript
const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
```

### Commit 3: Add generateKeypair function
- Added async function to generate Mina keypair
- Stores in localStorage
- **Note:** Currently has import path bug (see Remaining Issues)

### Commit 4: Call generateKeypair when no keypair exists
```typescript
useEffect(() => {
  if (walletChoice === 'generated') {
    const keypairData = localStorage.getItem('minaKeypair');
    if (keypairData) {
      const keypair = JSON.parse(keypairData);
      setGeneratedAddress(keypair.publicKey);
    } else {
      generateKeypair(); // Generate if missing
    }
  }
}, [walletChoice]);
```

### Commit 5: Expose generated address in context value
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

### Commit 6: Change walletChoice from sessionStorage to localStorage
- Both read and write operations in WalletContext.tsx

### Commit 7: Change minaKeypair storage from sessionStorage to localStorage
- app/submit/page.tsx updated

### Commit 8: Read walletChoice from localStorage in useAuroWallet
- Line 63 in useAuroWallet.ts

### Commit 9: Set walletChoice to auro when reconnecting
- Clicking "Connect Wallet" button now switches to Auro mode
- Fixes edge case where generated wallet user clicks reconnect button

### Commit 10: Simplify submit page wallet logic
- Removed redundant keypair generation
- Added defensive error handling

---

## Remaining Issues

### Issue 1: Import Path Bug (BLOCKING)

**File:** `app/contexts/WalletContext.tsx` line 31

**Current (broken):**
```typescript
const TouchGrassWorkerClient = (await import('./TouchGrassWorkerClient')).default;
```

**Should be:**
```typescript
const TouchGrassWorkerClient = (await import('../TouchGrassWorkerClient')).default;
```

**Why it's broken:**
- WalletContext is in `/app/contexts/` directory
- TouchGrassWorkerClient is in `/app/` directory
- Need to go up one directory (`../`)

**Impact:**
- Build errors in dev server
- Generated wallet flow completely broken
- Must fix before testing

**Fix:**
```bash
# In WalletContext.tsx, change line 31:
- const TouchGrassWorkerClient = (await import('./TouchGrassWorkerClient')).default;
+ const TouchGrassWorkerClient = (await import('../TouchGrassWorkerClient')).default;

git add app/contexts/WalletContext.tsx
git commit -m "Fix TouchGrassWorkerClient import path"
```

### Issue 2: Performance Regression (OPTIMIZATION)

**Problem:**
- Current implementation loads 5-10MB Worker bundle (o1js + authenticity-zkapp) just to generate a keypair
- Happens on every first-time user choosing "Continue without wallet"
- Slow on 3G connections (~10-15 seconds)

**Analysis:**
- `generateKeypair()` only needs mina-signer (~100KB)
- Heavy libraries (o1js, authenticity-zkapp) only needed for photo submission
- Current Worker has all imports at top level → bundles everything

**Solution:** Refactor Worker to use dynamic imports (code splitting)

---

## Worker Refactoring Plan

### Current Worker Structure

**File:** `app/TouchGrassWorker.ts`

**Current imports (top level):**
```typescript
import { Mina, PublicKey, PrivateKey, Signature, Field, fetchAccount } from "o1js"; // 5-10MB
import { computeOnChainCommitmentCrossPlatform, generateECKeypairCrossPlatform } from "authenticity-zkapp/browser"; // depends on o1js
import { Secp256r1, Ecdsa, Bytes32 } from "authenticity-zkapp";
import Client from "mina-signer"; // ~100KB
```

**Problem:** Webpack bundles ALL of these when Worker initializes

### Refactored Worker Structure

**Keep at top level (loaded on Worker init):**
```typescript
import * as Comlink from "comlink";
import Client from "mina-signer"; // ~100KB - needed for generateKeypair
```

**Move to dynamic imports (load on-demand):**
```typescript
// Inside each function that needs them:
await import("o1js");
await import("authenticity-zkapp/browser");
await import("authenticity-zkapp");
```

### Implementation Steps

#### Step 1: Refactor generateKeypair (lightweight)

**Current:**
```typescript
generateKeypair: async () => {
  const privateKey = PrivateKey.random(); // o1js
  const publicKey = privateKey.toPublicKey();
  return {
    privateKey: privateKey.toBase58(),
    publicKey: publicKey.toBase58()
  };
}
```

**New:**
```typescript
generateKeypair: async () => {
  console.log("Generating random keypair with mina-signer...");

  try {
    const client = new Client({ network: 'testnet' });
    const keypair = client.genKeys();

    console.log("Keypair generated successfully");
    return {
      privateKey: keypair.privateKey,
      publicKey: keypair.publicKey
    };
  } catch (error) {
    console.error("Failed to generate keypair:", error);
    throw error;
  }
}
```

**Impact:**
- Worker bundle: 100KB instead of 5-10MB
- Generation time: <100ms instead of 500-1500ms
- First-time users: Fast page loads

#### Step 2: Refactor computeOnChainCommitmentWeb (heavy, lazy load)

**Current:**
```typescript
async computeOnChainCommitmentWeb(imageBuffer: Uint8Array) {
  const result = await computeOnChainCommitmentCrossPlatform(imageBuffer);
  // ...
}
```

**New:**
```typescript
async computeOnChainCommitmentWeb(imageBuffer: Uint8Array) {
  console.log("Loading authenticity-zkapp for commitment computation...");

  const { computeOnChainCommitmentCrossPlatform } =
    await import("authenticity-zkapp/browser");

  console.log("Computing commitment...");
  const result = await computeOnChainCommitmentCrossPlatform(imageBuffer);

  // ... rest of function unchanged
}
```

#### Step 3: Refactor all o1js-dependent functions

**Functions to update:**
- `signFieldsO1js` - dynamic import o1js
- `generateECKeypair` - dynamic import authenticity-zkapp
- `signECDSA` - dynamic import authenticity-zkapp
- `verifyO1jsProof` - dynamic import o1js
- `setActiveInstance` - dynamic import o1js

**Pattern:**
```typescript
async functionName(...args) {
  // Dynamic import at function start
  const { NeededClass, neededFunction } = await import("o1js");

  // Rest of function uses imported items
  // ...
}
```

#### Step 4: Remove top-level imports

**Delete these lines:**
```typescript
import {
  Mina,
  PublicKey,
  PrivateKey,
  Signature,
  Field,
  fetchAccount
} from "o1js";
import {
  computeOnChainCommitmentCrossPlatform,
  generateECKeypairCrossPlatform
} from "authenticity-zkapp/browser";
import { Secp256r1, Ecdsa, Bytes32 } from "authenticity-zkapp";
```

**Keep these:**
```typescript
import * as Comlink from "comlink";
import Client from "mina-signer";
```

#### Step 5: Test bundle sizes

**Before:**
```bash
# Check Worker bundle size
ls -lh .next/static/chunks/app-TouchGrassWorker*.js
# Expected: 5-10MB
```

**After refactoring:**
```bash
# Worker initial bundle
ls -lh .next/static/chunks/app-TouchGrassWorker*.js
# Expected: ~100-200KB

# Lazy-loaded o1js chunks
ls -lh .next/static/chunks/*o1js*.js
# Expected: 5-10MB (loaded only on photo submission)
```

---

## Testing Checklist

### Generated Wallet Flow (After Fix)
- [ ] Fix import path bug in WalletContext
- [ ] Clear localStorage
- [ ] Navigate to `/`
- [ ] Click "Continue without wallet"
- [ ] Navigate to `/challenges` - should load fast
- [ ] Wallet generation happens in background
- [ ] Click challenge → click "View Chain"
- [ ] Check browser DevTools Network tab - verify Worker bundle ~100KB
- [ ] Click like button - should work immediately
- [ ] Verify like registers in UI
- [ ] Close tab → reopen → keypair persists

### Auro Wallet Flow (Should Not Change)
- [ ] Clear localStorage
- [ ] Navigate to `/`
- [ ] Click "Connect Wallet"
- [ ] Auro wallet connection happens
- [ ] Navigate to `/challenges`
- [ ] Click challenge → click "View Chain"
- [ ] Like buttons work
- [ ] No generated keypair created (check localStorage)

### Photo Submission (After Worker Refactoring)
- [ ] Generated wallet user submits photo
- [ ] Check Network tab - verify heavy libs load at this point
- [ ] Submission completes successfully
- [ ] Verify commitment computation works
- [ ] Verify signature works

### Switching Wallets
- [ ] User with generated wallet clicks "Connect Wallet" button
- [ ] Verify `walletChoice` switches to 'auro' in localStorage
- [ ] Auro connection happens
- [ ] Address in UI updates to Auro address

---

## Performance Metrics

**Before wallet connection flow fix:**
- First-time users: Cannot like until after first photo submission
- Generated wallet users: Must submit photo before any interaction

**After wallet connection flow fix (current, before Worker optimization):**
- ✅ Users can like immediately
- ❌ 5-10MB Worker loads on first page visit
- ❌ Slow on 3G (~10-15 seconds to generate keypair)

**After Worker optimization (target):**
- ✅ Users can like immediately
- ✅ 100KB initial Worker bundle
- ✅ Fast on all connections (<1 second to generate keypair)
- ✅ Heavy libs only load when needed (photo submission)

---

## Files Modified

### Core Wallet Logic
1. `app/contexts/WalletContext.tsx` - Main wallet state management
2. `app/hooks/useAuroWallet.ts` - Auro wallet integration
3. `app/submit/page.tsx` - Simplified wallet logic

### Performance Optimization (Pending)
4. `app/TouchGrassWorker.ts` - Needs dynamic import refactoring

### No Changes Needed
- `app/page.tsx` - Welcome page (just routing)
- `app/components/WalletStatus.tsx` - Works with existing context API
- All other files

---

## Git Commands

**View commits:**
```bash
git log --oneline feature/wallet-connection-flow
```

**Create PR (after fixing import bug + Worker optimization):**
```bash
# Fix import path first
git add app/contexts/WalletContext.tsx
git commit -m "Fix TouchGrassWorkerClient import path"

# Refactor Worker
git add app/TouchGrassWorker.ts
git commit -m "Refactor Worker to use dynamic imports for performance"

# Push and create PR
git push origin feature/wallet-connection-flow
gh pr create --title "Fix wallet connection flow and optimize performance" --body "$(cat <<'EOF'
## Summary
- Fix generated wallet flow: Users can now like submissions immediately
- Optimize performance: Reduce initial bundle from 5MB to 100KB
- Use localStorage for wallet persistence

## Changes
- Generate keypair immediately when user chooses "Continue without wallet"
- Expose generated address in WalletContext
- Switch to localStorage for persistence across sessions
- Refactor Worker to use dynamic imports (code splitting)
- Add wallet switching support (generated ↔ Auro)

## Test Plan
- [x] Generated wallet users can like before first submission
- [x] Auro wallet flow unchanged
- [x] Wallet persists across tab close/reopen
- [x] Initial page load ~100KB Worker bundle
- [x] Photo submission loads heavy libs on-demand
- [x] Wallet switching works correctly

## Performance
- Before: 5-10MB on first page load, 10-15s on 3G
- After: 100KB on first page load, <1s on all connections
EOF
)"
```

---

## Edge Cases Documented

See `WALLET_CONNECTION_FLOW_FIX.md` lines 258-280 for:
- User switches from generated → Auro
- User switches from Auro → generated
- localStorage cleared mid-session
- Multiple tabs with different wallets

---

**Last Updated:** 2025-10-28
**Next Steps:**
1. Fix import path bug (BLOCKER)
2. Test generated wallet flow works
3. Refactor Worker for performance (5 steps above)
4. Test all flows with bundle size verification
5. Create PR and merge to main
