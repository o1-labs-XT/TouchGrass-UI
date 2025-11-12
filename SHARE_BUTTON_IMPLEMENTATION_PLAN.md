# Share Button & OpenGraph Metadata Implementation Plan

## Overview
This document outlines the implementation plan for enabling rich social media previews when sharing submission links and auto-opening the modal when accessing URLs with `?submission=` query parameters.

## Current State

### What Works
- Share button in modal generates correct URL format: `/chain/{chainId}?submission={id}`
- Web Share API with clipboard fallback implemented in `SubmissionCarousel3D.tsx:247-277`
- Modal displays submission details correctly
- Similar functionality already works for `/submission/[id]` routes

### What's Missing
- OpenGraph metadata tags for social media previews
- Auto-open modal when URL contains `?submission=` query parameter
- Chain page cannot generate metadata (it's a Client Component)

## Technical Constraint

**Problem**: `/app/chain/[id]/page.tsx` has `'use client'` directive (line 1), which means:
- Cannot export `generateMetadata()` function
- Cannot generate OpenGraph tags for social previews
- All logic runs client-side only

**Solution**: Split into Server + Client components (same pattern as submission page)

## Reference Implementation

The submission page already uses this exact pattern successfully:

**Files:**
- `/app/submission/[id]/page.tsx` - Server Component with `generateMetadata()`
- `/app/submission/[id]/SubmissionDetailClient.tsx` - Client Component with all interactive logic

**Key Code Reference:**
```typescript
// /app/submission/[id]/page.tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const submission = await getSubmission(id);
  const imageUrl = getImageUrl(submission.id);

  return {
    title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
    openGraph: {
      images: [{ url: absoluteImageUrl, width: 1200, height: 630 }],
      // ... more metadata
    }
  };
}
```

## Implementation Steps

### Phase 1: Create Client Component File

**Step 1.1: Create ChainDetailClient.tsx**
- Create new file: `/app/chain/[id]/ChainDetailClient.tsx`
- Copy ALL content from current `page.tsx` (lines 3-99)
- Keep `'use client'` directive at the top
- Add interface for props:
  ```typescript
  interface ChainDetailClientProps {
    params: Promise<{ id: string }>;
    initialSubmissionId?: string;
  }
  ```
- Update function signature to accept props
- File should be ~105 lines (same logic, just moved)

**Verification:**
- File compiles without errors
- No functionality changes yet

**Commit Message:**
```
Create ChainDetailClient component
```

---

### Phase 2: Update SubmissionCarousel3D to Accept Initial Submission

**Step 2.1: Add initialSubmissionId prop**
- File: `/app/components/SubmissionCarousel3D.tsx`
- Update interface at line 12:
  ```typescript
  interface SubmissionCarousel3DProps {
    submissions: Submission[];
    initialSubmissionId?: string;
  }
  ```
- Update function signature at line 31

**Verification:**
- TypeScript compiles
- Component still works without prop

**Commit Message:**
```
Add initialSubmissionId prop to carousel
```

---

**Step 2.2: Add effect to auto-open modal**
- File: `/app/components/SubmissionCarousel3D.tsx`
- Add after line 43 (after other state declarations):
  ```typescript
  // Auto-open modal if initialSubmissionId provided
  useEffect(() => {
    if (initialSubmissionId && submissions.length > 0) {
      const submission = submissions.find(s => s.id === initialSubmissionId);
      if (submission) {
        setSelectedSubmission(submission);
      }
    }
  }, [initialSubmissionId, submissions]);
  ```

**Verification:**
- Component still renders normally without prop
- No errors in console

**Commit Message:**
```
Implement auto-open modal on initialSubmissionId
```

---

### Phase 3: Update ChainDetailClient to Pass Submission ID

**Step 3.1: Pass initialSubmissionId to carousel**
- File: `/app/chain/[id]/ChainDetailClient.tsx`
- Update props interface:
  ```typescript
  interface ChainDetailClientProps {
    params: Promise<{ id: string }>;
    initialSubmissionId?: string;
  }
  ```
- Destructure in function signature:
  ```typescript
  export default function ChainDetailClient({
    params,
    initialSubmissionId
  }: ChainDetailClientProps) {
  ```
- Update SubmissionCarousel3D render (line ~96):
  ```typescript
  <SubmissionCarousel3D
    submissions={submissions}
    initialSubmissionId={initialSubmissionId}
  />
  ```

**Verification:**
- Component renders correctly
- Prop is passed through properly

**Commit Message:**
```
Pass initialSubmissionId to carousel
```

---

### Phase 4: Convert page.tsx to Server Component

**Step 4.1: Update page.tsx**
- File: `/app/chain/[id]/page.tsx`
- Remove `'use client'` directive (line 1)
- Remove all imports except backendClient functions and ChainDetailClient
- Replace entire default export with:
  ```typescript
  import ChainDetailClient from './ChainDetailClient';

  interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ submission?: string }>;
  }

  export default async function ChainDetailPage({ params, searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const initialSubmissionId = resolvedSearchParams.submission;

    return <ChainDetailClient params={params} initialSubmissionId={initialSubmissionId} />;
  }
  ```

**Verification:**
- Page still loads correctly
- No functionality changes
- TypeScript compiles

**Commit Message:**
```
Convert chain page to server component
```

---

### Phase 5: Add Metadata Generation

**Step 5.1: Add generateMetadata function**
- File: `/app/chain/[id]/page.tsx`
- Add after imports, before default export:
  ```typescript
  import { Metadata } from 'next';
  import { getSubmission, getImageUrl } from '../../lib/backendClient';

  export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    try {
      const resolvedSearchParams = await searchParams;
      const submissionId = resolvedSearchParams.submission;

      // If no submission query param, return default chain metadata
      if (!submissionId) {
        return {
          title: 'TouchGrass - Chain',
          description: 'View photo submissions in this TouchGrass chain.',
        };
      }

      // Fetch submission data for rich preview
      const submission = await getSubmission(submissionId);
      const imageUrl = getImageUrl(submission.id);

      // Construct absolute URLs
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'production'
        ? 'https://touchgrass-ui.vercel.app'
        : 'http://localhost:3000';

      const { id } = await params;
      const pageUrl = `${baseUrl}/chain/${id}?submission=${submissionId}`;
      const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;

      return {
        title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
        description: `Check out this submission from TouchGrass! Position #${submission.chainPosition} in the chain. ${submission.tagline || 'A verified photo submission on the Mina blockchain.'}`,
        openGraph: {
          title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
          description: `Check out this submission from TouchGrass! Position #${submission.chainPosition} in the chain.`,
          url: pageUrl,
          siteName: 'TouchGrass',
          images: [
            {
              url: absoluteImageUrl,
              width: 1200,
              height: 630,
              alt: submission.tagline || `TouchGrass submission #${submission.chainPosition}`,
            },
          ],
          locale: 'en_US',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `TouchGrass - ${submission.tagline || `Submission #${submission.chainPosition}`}`,
          description: `Check out this submission from TouchGrass! Position #${submission.chainPosition} in the chain.`,
          images: [absoluteImageUrl],
        },
      };
    } catch (error) {
      console.error('Error generating metadata:', error);
      return {
        title: 'TouchGrass - Chain',
        description: 'View photo submissions in this TouchGrass chain.',
      };
    }
  }
  ```

**Verification:**
- No TypeScript errors
- Page still loads correctly
- Check metadata in HTML source (view page source)

**Commit Message:**
```
Add OpenGraph metadata generation
```

---

### Phase 6: Test Social Sharing (CRITICAL)

**Step 6.1: Test URL with query parameter**
- Navigate to: `http://localhost:3000/chain/{chainId}?submission={submissionId}`
- **Expected**: Modal should auto-open with correct submission
- **Verify**: Check browser console for errors
- **Check**: Modal displays correct submission data

**Step 6.2: Test metadata in HTML**
- View page source (right-click → View Page Source)
- **Expected**: See `<meta property="og:image" content="...">` tags in `<head>`
- **Expected**: See submission-specific title and description
- **Check**: Image URL is absolute (starts with http)

**Step 6.3: Test social preview**
- Option 1: Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Option 2: Use Twitter Card Validator: https://cards-dev.twitter.com/validator
- Option 3: Use ngrok + test in actual social media post
- **Expected**: See submission image, title, and description in preview
- **Critical**: If images don't show, check CORS and absolute URLs

**Step 6.4: Test share button flow**
- Click share button in modal
- **Expected**: URL copied to clipboard with format `/chain/{chainId}?submission={id}`
- Open URL in new tab
- **Expected**: Modal auto-opens to correct submission

**Step 6.5: Test without query parameter**
- Navigate to: `http://localhost:3000/chain/{chainId}` (no ?submission=)
- **Expected**: Page loads normally, no modal, default carousel view
- **Expected**: Generic chain metadata (not submission-specific)

---

## Testing Checklist

### Functional Tests
- [ ] Chain page loads without query parameter
- [ ] Carousel displays all submissions correctly
- [ ] Clicking share button copies correct URL
- [ ] Opening URL with `?submission=` auto-opens modal
- [ ] Modal displays correct submission data
- [ ] ESC key closes modal
- [ ] Like button works in modal
- [ ] Progress timeline displays correct status

### Metadata Tests
- [ ] View page source shows OpenGraph tags
- [ ] og:image URL is absolute (not relative)
- [ ] og:title contains submission tagline
- [ ] Twitter card metadata present
- [ ] Facebook debugger shows correct preview
- [ ] Twitter card validator shows correct preview
- [ ] Image loads in social preview (not blocked by CORS)

### Regression Tests
- [ ] Chain page without submission param works
- [ ] Carousel navigation still works
- [ ] Direct carousel interaction unchanged
- [ ] Back button navigation works
- [ ] "Extend Chain" button works
- [ ] Stats display correctly

### Edge Cases
- [ ] Invalid submission ID in query param (should fail gracefully)
- [ ] Submission ID from different chain (should handle error)
- [ ] Very long taglines don't break layout
- [ ] Missing tagline uses fallback text
- [ ] Network errors during metadata generation

---

## Potential Issues & Solutions

### Issue 1: Images Don't Show in Social Previews
**Symptom**: Social media shows broken image icon
**Causes**:
- Image URL is relative, not absolute
- CORS headers not set on image server
- Image doesn't exist at that URL

**Solution**:
```typescript
// Check baseUrl construction
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

// Ensure image URL is absolute
const absoluteImageUrl = imageUrl.startsWith('http')
  ? imageUrl
  : `${baseUrl}${imageUrl}`;
```

### Issue 2: Modal Doesn't Auto-Open
**Symptom**: URL has `?submission=` but modal doesn't open
**Debug Steps**:
1. Check if `initialSubmissionId` is being passed to ChainDetailClient
2. Check if carousel receives the prop
3. Check useEffect dependency array
4. Verify submission exists in submissions array
5. Check console for errors

**Solution**: Add logging in useEffect:
```typescript
useEffect(() => {
  console.log('initialSubmissionId:', initialSubmissionId);
  console.log('submissions:', submissions.length);
  if (initialSubmissionId && submissions.length > 0) {
    const submission = submissions.find(s => s.id === initialSubmissionId);
    console.log('Found submission:', submission);
    if (submission) {
      setSelectedSubmission(submission);
    }
  }
}, [initialSubmissionId, submissions]);
```

### Issue 3: TypeScript Errors After Split
**Symptom**: "Cannot find module" or type errors
**Solution**:
- Verify all imports in both files
- Check that ChainDetailClient is exported as default
- Ensure types are imported from correct paths
- Run `npm run build` to catch build-time errors

### Issue 4: Hydration Mismatch
**Symptom**: "Hydration failed" error in console
**Cause**: Server-rendered HTML doesn't match client render
**Solution**:
- Don't use `window` or `document` in initial render
- Use `useEffect` for client-only logic
- Ensure modal state starts as `null` on both server and client

---

## Key Implementation Notes

### Small Commits Strategy
Each phase above should be 1 commit. Never combine:
- File creation + logic changes
- Multiple component updates
- Functionality changes + styling

### Verification After Each Step
Before committing:
1. `npm run dev` - Server starts without errors
2. Navigate to chain page - Page loads correctly
3. Check console - No errors or warnings
4. Test affected functionality - Works as expected

### Rollback Strategy
If any step causes issues:
1. `git reset HEAD~1` to undo last commit
2. `git checkout .` to discard changes
3. Review error messages carefully
4. Check assumptions against evidence
5. Fix issue before proceeding

---

## Success Criteria

✅ Share button copies URL in format: `/chain/{chainId}?submission={id}`
✅ Opening shared URL auto-opens modal to correct submission
✅ Social media platforms show rich preview with submission image
✅ Page works correctly with and without query parameter
✅ No breaking changes to existing carousel functionality
✅ All tests pass
✅ No TypeScript errors
✅ No console warnings or errors

---

## Estimated Effort

- Phase 1: 15 minutes
- Phase 2: 15 minutes
- Phase 3: 10 minutes
- Phase 4: 15 minutes
- Phase 5: 20 minutes
- Phase 6: 30 minutes (testing)

**Total: ~2 hours** (including testing and verification)

---

## References

- Existing implementation: `/app/submission/[id]/page.tsx`
- Share button logic: `/app/components/SubmissionCarousel3D.tsx:247-277`
- Backend client: `/app/lib/backendClient.ts`
- Next.js metadata docs: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- OpenGraph protocol: https://ogp.me/
