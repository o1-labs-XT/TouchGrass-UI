# GrassyButton Implementation Status

## What Was Done

### 1. SVG Asset Optimization (Completed)
- Created optimization script: `optimize-button-svgs.js`
- Optimized all 8 button SVG variants with SVGO (floatPrecision: 0)
- Results: 96.5% reduction (1.4MB → 48KB total)
- All assets saved to `/public/assets/`:
  - `grassy-button-primary.svg` (5.2KB)
  - `grassy-button-primary-hover.svg` (5.2KB)
  - `grassy-button-secondary.svg` (11KB)
  - `grassy-button-secondary-hover.svg` (11KB)
  - `grassy-button-short-primary.svg` (2.4KB)
  - `grassy-button-short-primary-hover.svg` (2.4KB)
  - `grassy-button-short-secondary.svg` (5.3KB)
  - `grassy-button-short-secondary-hover.svg` (5.3KB)

### 2. Component Update (Completed)
- Added `size?: 'wide' | 'short'` prop to GrassyButton.tsx
- Default value: `'wide'` (backward compatible)
- Component now applies size class alongside variant class

## What Needs To Be Done Next

### Step 1: Update GrassyButton.module.css
**File:** `app/components/GrassyButton.module.css`

Replace lines 18-32 with:
```css
.wide.primary {
  background-image: url('/assets/grassy-button-primary.svg');
}

.wide.primary:hover:not(.disabled) {
  background-image: url('/assets/grassy-button-primary-hover.svg');
}

.wide.secondary {
  background-image: url('/assets/grassy-button-secondary.svg');
}

.wide.secondary:hover:not(.disabled) {
  background-image: url('/assets/grassy-button-secondary-hover.svg');
}

.short.primary {
  background-image: url('/assets/grassy-button-short-primary.svg');
}

.short.primary:hover:not(.disabled) {
  background-image: url('/assets/grassy-button-short-primary-hover.svg');
}

.short.secondary {
  background-image: url('/assets/grassy-button-short-secondary.svg');
}

.short.secondary:hover:not(.disabled) {
  background-image: url('/assets/grassy-button-short-secondary-hover.svg');
}
```

**Commit message:** `Update GrassyButton CSS with short button variants`

### Step 2: Fix Challenge Page Layout
**File:** `app/challenge/[id]/Challenge.module.css`

**Lines 81-91** - Add padding and max-width:
```css
.buttonGroup {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  padding: 0 1rem;
  max-width: 320px;
  margin: 0 auto;
}

.buttonGroup button {
  flex: 0 0 auto;
}
```

**File:** `app/challenge/[id]/page.tsx`

Find the buttons in the challenge detail section and add `size="short"`:
```tsx
<GrassyButton variant="primary" size="short">Join Challenge</GrassyButton>
<GrassyButton variant="secondary" size="short">View Chain</GrassyButton>
```

**Commit message:** `Fix Challenge page button layout and sizing`

### Step 3: Fix Submit Page Layout
**File:** `app/submit/Submit.module.css`

**Lines 108-119** - Update gap and max-width:
```css
.buttonGroup {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  max-width: 320px;
  margin: 0 auto;
  padding: 0 1rem;
}

.buttonGroup button {
  flex: 0 0 auto;
}
```

**File:** `app/submit/page.tsx`

Add `size="short"` to side-by-side buttons:
```tsx
<GrassyButton variant="secondary" size="short">Retake</GrassyButton>
<GrassyButton variant="primary" size="short">Submit</GrassyButton>
```

**Commit message:** `Fix Submit page button layout and sizing`

### Step 4: Fix CameraCapture Layout
**File:** `app/components/CameraCapture.module.css`

**Lines 26-38** - Update gap, max-width, remove flex:1:
```css
.controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: nowrap;
  max-width: 320px;
  margin: 0 auto;
  padding: 0 1rem;
}

.controls button {
  flex: 0 0 auto;
}
```

**File:** `app/components/CameraCapture.tsx`

Add `size="short"` to control buttons:
```tsx
<GrassyButton variant="secondary" size="short">Cancel</GrassyButton>
<GrassyButton variant="primary" size="short">Capture</GrassyButton>
```

**Commit message:** `Fix CameraCapture button layout and sizing`

### Step 5: Cleanup
Delete temporary files:
```bash
rm optimize-button-svgs.js
rm optimized-svgs.txt
rm app/components/GrassyButton.tsx.backup
```

**Commit message:** `Remove temporary optimization files`

## Design Specifications

### Button Sizes (from Figma)
- **Wide:** 258.883px × 38.766px (for welcome page, single buttons)
- **Short:** 121.133px × 38.426px (for side-by-side layouts)

### Layout Standards
- **Gap between buttons:** 0.75rem (12px)
- **Container max-width:** 320px
- **Container padding:** 0 1rem (prevents edge touching on mobile)
- **Button flex:** `0 0 auto` (prevents stretching)

## Original Problem

After PR #24 merge, mobile buttons had:
1. Challenge detail page: Buttons extending to card edges, no spacing
2. Submit photo page: Buttons cut off, not fully in viewport, appearing too large
3. Overall inconsistency across pages making app feel unprofessional

## Architecture Decision

**Chosen approach:** Static SVG files with CSS `background-image`
- ✅ Browser lazy-loads only rendered images
- ✅ Service worker can cache separately from JS
- ✅ No JS parse cost
- ✅ Optimal for mobile PWA (48KB total for all 8 variants)

**Rejected approach:** Inline SVG in component
- ❌ 217KB would be added to every page's JS bundle
- ❌ Increases Time to Interactive on mobile
- ❌ Cache busts with any JS change
- ❌ Poor mobile performance

## Files Modified
- ✅ `/public/assets/grassy-button-*.svg` (8 files) - COMMITTED
- ✅ `app/components/GrassyButton.tsx` - COMMITTED
- ⏳ `app/components/GrassyButton.module.css` - NEEDS UPDATE
- ⏳ `app/challenge/[id]/Challenge.module.css` - NEEDS UPDATE
- ⏳ `app/challenge/[id]/page.tsx` - NEEDS UPDATE
- ⏳ `app/submit/Submit.module.css` - NEEDS UPDATE
- ⏳ `app/submit/page.tsx` - NEEDS UPDATE
- ⏳ `app/components/CameraCapture.module.css` - NEEDS UPDATE
- ⏳ `app/components/CameraCapture.tsx` - NEEDS UPDATE

## Testing Checklist
After completing all steps, verify on mobile:
- [ ] Welcome page: Wide buttons, centered, proper spacing
- [ ] Challenge detail: Short buttons side-by-side, not touching edges
- [ ] Submit page: Short buttons side-by-side, fully in viewport
- [ ] Camera capture: Short buttons side-by-side, proper layout
- [ ] All buttons maintain aspect ratio
- [ ] Hover states work correctly
- [ ] No layout shifts or overflow on 375px width (iPhone SE)
