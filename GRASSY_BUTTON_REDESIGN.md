# GrassyButton Redesign: Inline SVG with CSS Fill Colors

## Root Causes

1. **Component hardcodes width** - `width: 100%; min-width: 100%` forces all buttons full-width
2. **Only wide button SVGs exist** - missing short (122px) variant
3. **Inconsistent width overrides** - 180px, 140px, 200px across pages creates visual padding inconsistency
4. **No container padding** - button groups touch card edges
5. **Flex behavior issues** - `flex: 1` in CameraCapture causes unwanted stretching

## Solution Architecture

### SVG Approach: Inline SVG with CSS-controlled fill colors

- **4 SVG paths total** (short/wide × primary/secondary)
- Path data identical across states - only fill color changes
- CSS handles hover/active states via `:hover` and `:active` pseudo-classes

### Button Sizing

- **Short:** 122px × 39px (for side-by-side layouts)
- **Wide:** 259px × 39px (for single/stacked layouts)
- Component-controlled via `size` prop

### Padding Consistency

- 16px horizontal padding on all buttons
- Consistent because only 2 button widths (not 3+)
- Short buttons: 13.1% padding ratio (always same)
- Wide buttons: 6.2% padding ratio (always same)

---

## Implementation

### 1. GrassyButton.tsx

**Add size prop:**

```tsx
interface GrassyButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'short' | 'wide';  // NEW - default 'wide'
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}
```

**Add SVG constants (copy from current files + Figma):**

```tsx
const SVG_PATHS = {
  short: {
    primary: {
      viewBox: "0 0 122 39",
      path: "<paste from Figma short primary button>"
    },
    secondary: {
      viewBox: "0 0 122 39",
      path: "<paste from Figma short secondary button>"
    }
  },
  wide: {
    primary: {
      viewBox: "0 0 259 39",
      path: "M232 0v1h2-1 1l1 1V1v1l1-1v1-1l1 1V1v1h1V1h1v1-1h1v1-1 1h1V0v1h1v1h1V1v2-1h1V0v2h3q-1 0 0 0h1v1h2V2l1-1v1l-1 1h1V2h1l1-1v3l1-1v2l1-1v1h-1v1l1-1h2-1v2h-1l1 1h-1v3l1-1q1 0 0 0l1 1v1h-1 1v1h1l1 1h-1q0 1 0 0l-1 1h1-1v1h2-3v1q0 1 0 0v1l1-1h2-1v1h-2v1h-1 1v1h-1 1l1-1v2h-1v1h1-1 1l-1 1h-1 1v1l1 1h-1 1v1h-2 1v1h-1v1h1v1q-1 0 0 0h-1v2h1v1l-1-1h-1v1h1v1h-2v2h-1l-1 1v-1h-1v1h-1v-1 2h-1v-1h-2v1-1h-1v1-1h-2v1l-1-1v1-1h-1v1-1h-1q0 1 0 0l-1 1v-1 1h-1v-1 1q0 1 0 0l-1-1v1h-1v-1l-1 1q0 1 0 0l-1 1v-1h-1v-1 1h-1v1-2 1h-1v-1 1l-1-1v1h-1q0-1 0 0v-1h-1v1h-1v-1h-1v1l-1-1v1-1h-1v1l-1-1q0 1 0 0l-1 1v-1l-1 1v-1 1q0 1 0 0l-1-1v1h-1v-1l-1 1h-1v1h-1 1v-1h-2v1-2h-2q0 1 0 0v1h-1q-1 0 0 0 0-1 0 0h-1v-1 1h-1v-1 1-1h-1v2-2l-1 1v-1 2-1h-1v-1 1h-1v1h-1l1-1v-1l-1 1v-1 1h-2l-1 1v-1h1-2v-1 1l-1-1v1h-1v-1 1l-1 1v-1h-1q0 1 0 0v1h-1v-2 1h-1v1-2l-1 1v-1h-1v-1 2-1h-2q2 0 0 0l-1 1v-1 1h-1v-1h-1l-1 1v-1 1l-1-1-1 1v-1h-1v1-1h-1v1-1 1h-1v-1 1h-1l-1-1h-1v1h1-1v1h-1v-2h-1v2-1h-1v-1h-1q0 1 0 0l-1 1q-1 0 0 0h-1v-1h-1v1h-1l1-1h-1l-1 1v-1q0 1 0 0v2h-1v-2 1-1 1h-1v1-2h-1v1l-1 1v-1q1-1 0 0v-1 1h-3v1-1h-1l-1-1v1-1l-1 1v-1l-1 1v1-1h-1v1-1h-1v1-2q-1 0 0 0h-1v2h-1 1v-2h-1v1-1h-1v1-1 1h-1l-1-1q0 1 0 0h-1v1-1l-1 1q0 1 0 0v-1l-1 1h-3v-1 1h-2v-1 1h-1q0 1 0 0l-1-1v1h-1v-1l-1 1v1-1l-1 1v-1q0 1 0 0h-1v-1 2h-1v-1h-2l-1 1v-2 1h-2l1-1h-1q0 1 0 0h-1v1l-1-1v1h-1q-1 0 0 0h-1v1-2l-1 1v-1 2-1h-1v-1 1h-1v1q-1 0 0 0v-1h-1q1 0 0 0h-1v1-1h-1v1-1h-2v1-1q0-1 0 0h-1v-1 1l-1 1v-1 1-1 1h-1v-1 1-1l-1 1v-1 2-1h-1v-2 1h-1v1-2 1h-1v-1 1-1h-1v1l-1-1q0-1 0 0v1l1 1-1-1h-1v-1l-1 1v-1 1h-1v-1 1h-4v-1l-1 1q0-1 0 0h-1v-1 1h-1q-1 0 0 0 0 2 0 0l-1-1v1h-2v1l-1-1v1l-1 1v-2h-1v1-1h-3v1-1h-1v-1 1h-2l1-1h-1v1-1l-1 1q0-1 0 0h-1v1h-1v-2 1l-1 1v-2l-1 1v1h-1v-1q1 0 0 0h-1v1h-1v-1 1h-1v-1h-1v1l-1-2v1-1l-1 2v-1 1h-1v-1l-1 1v-1h-1v2-3 1h-1v1-2 1h-1v-1 1l-1-1q0 1 0 0h-1v1-1q0-1 0 0v2-1h-1l-1-1v1l-1-1v1h-1 1-4q-1 0 0 0h-3v-1 1h-1l1 1h-1l-1-1h-2v1-1l-1 2v-2q0 1 0 0h-1v1h-1v-1h-2l-1 1v-2h-1v1h-1l1-1v1l-1-1v1h-1l1-1-1 1h-1q-1 0 0 0h-1v1-1h-1v-1 2h-1v-1h-1v1-1 1-1h-1v-1 2l-1-1-1 1v-1h-1l-1 1v-1h-1q1 0 0 0v1-1h-1v1h-1l1-1-1 1h-1v-1q0 1 0 0v2-1h-1v-1q0-1 0 0l-1 1h1-1v-2 1h-1v-1 1-1h-1v1l1 1-1-1h-1v-1l-1 1v-1 1h-1q0 1 0 0h-4v-1 1h-2v-1 1h-1q0 1 0 0l-1-1v1h-2v1l-1-1v2-1h-1 1v-1h-1v-1 1l-1 1v-2l-1 1h-1l-1 1v-1H9l1-1H9v1H8l1-1H7h1-1v-3H6l-1 1H4v-1h1v-1H4v1-1l-1 1v-1 1l1-2H1h1v-1h1-1q-1 0 0 0h1l-1-1-1-1h2-2 1v-1h1q-1 0 0 0v-1H2v-1H1h1v-1q-1 0 0 0H1v-1H0h2v-1H1v-1h1v-4H1h1-1v-2h1v-1H1h1l-1-1h1v-1l1-1q-1 0 0 0l-1-1 1-1H2h1V8h1-1V7h1V6l1 1V6h1L5 5h1v1-1h1V4h1-1 2V3q0 1 0 0h1V2v1-1h1v1-2 1h1v1-3l1 1v1-1 1l1-1v1-1h1v2-2l1 1v1-1h1v1-1q0-1 0 0h2-1V1h1v1h1V1v1h1v1-1h1l-1-1h1v1-1 1h1v1-1h1V1v2-1l1 1V1v1h1q-1 0 0 0v1l1-1v1-1h1v1h1l-1-1h1v1h1l-1-1h1V1l1 1h1v1h1V1v1h2V1q-1 0 0 0 0-1 0 0v1l1-1v1l1 1V2h1v1l1-1q0-1 0 0v1-1h1v1-1h1q0 1 0 0h5q0-1 0 0h1v1-1l1 1 1-1 1-1v1l-1 1h1q0-1 0 0V2v1-1h1v1h1l-1-1V1q1 0 0 0h1v2-1l1-1V0v2h1V1v1-1l1 1-1-1h1v1l1 1V1v2l1-1v1-2l1 1h1V1v1h1l1-1v1h1v1-1q1 0 0 0V1l1 1V1v2h1V1l1 1v1-1 1-2h1v1h1q0 1 0 0l1 1V2h1v1h1V2h1v1-1h1V1v1h1-1l1 1V2h2V1v1l1 1V1q0-1 0 0h1v1-1 1h1v1l1-1v1h1V2h1q-1 0 0 0h1v1-1 1l1-1v1-1l1 1V2h1l1 1q0-1 0 0V2h1v1-1h1v1-1h1v1h1V2h2-1v1l1-1v1-1 1-1h1v1-2 1h1v1-3l1 1v1-1l1 1V1v1-1h1v2-2h1v2-1h1v1-1h2V1q-1 0 0 0v1h1q1 0 0 0h1v1-1h1V1v1h1v1-1h1V1v2-1l1 1V1v1h1q-1 0 0 0l1 1V2h1v1h2l-1-1h1v1h1V2h1v1l1-1v1-1 1l1-1V1l1 1v1-1h1V1q-1 0 0 0 0-1 0 0v1l1-1v2-1l1 1V2h1v1l1-1q0-1 0 0v1-1h1q1 0 0 0 0 1 0 0v1-1l1 1q0-1 0 0l1-1v1h1V2h1v1h2V2v1h1V2v1h2V2h1v1h-1l1 1V3h1q1 0 0 0v1l1-1V2v1h1l-1-1V1h1v2h1V1v2h1V2h1V1v1l1 1V2l1 1V2v1-1h2V1v1h1v1-1h1v1-1h1v1-2 1h1v1h1V2h1l-1 1 1-1v1-2h1v2q0-1 0 0V2l1 1h1V2v1h1l-1-1 1 1h1V2h1-1 1l1 1V2h1-1v1h1V1h1v1h1V1q0-1 0 0h1v1-1 1h1v1l1-1v1h1V2h1l-1 1 1-1v1l1-1v1h1V2v1h1V2l1 1V2l1 1h1V2h1l-1 1h1V2l1 1h1l1-1v1-1l1 1V1v1l1 1V1h1-1v1h1q0-1 0 0h1V1v1h1v1-1h1v1-1l1 1V2h1V1v1h1v1-1h1v1-1h1v1-2h1v2h1V2h1v1-1 1-2h1v2-1h1v1h1V2l1 1V2h1v1-1h1q0 1 0 0h1v1l1-1-1 1h1V2h1V1v1h2-1V1h1v1h1v1q0-1 0 0l1-1h1v1l1-1v1-1 1h1V2v1h1V2l1 1 1-1v1-1l1 1q0-1 0 0h1V2h1v1-1h1v1h2V1v1h1v1-2h1q-1 0 0 0v2-1h1q1 0 0 0V1l1 1v1h1l-1-1h1v1q1 0 0 0l1-1v1-1q1 0 0 0h2v1h1V2v1h1V2v1h1V1v1h1v1l1-1v1-1l1 1V1v2h1V2v1h1V2h1v1h1l-1-1V1v1h1v1-1l1-1zM8 36q1-1 0 0m-5-8q-1 0 0 0M9 3Q8 3 9 3m20-1v1zm124 0v1zm39 0v1zm-82 1q1 0 0 0M70 2v1m183 0q0-1 0 0M75 2q-1 0 0 0M26 2q-1 0 0 0m132 0q1 0 0 0m74 0q0 1 0 0m-5-1"
    },
    secondary: {
      viewBox: "0 0 259 39",
      path: "<paste from current grassy-button-secondary.svg>"
    }
  }
};
```

**Refactor component to render inline SVG:**

```tsx
export default function GrassyButton({
  variant,
  size = 'wide',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}: GrassyButtonProps) {
  const svgData = SVG_PATHS[size][variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[size]} ${styles[variant]} ${disabled ? styles.disabled : ''} ${className}`}
    >
      <svg
        className={styles.svg}
        viewBox={svgData.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <path d={svgData.path} className={styles.path} />
      </svg>
      <span className={styles.text}>{children}</span>
    </button>
  );
}
```

---

### 2. GrassyButton.module.css

**Complete refactor - remove background-image approach, add inline SVG + size classes:**

```css
.button {
  position: relative;
  display: block;
  border: none;
  outline: none;
  background-color: transparent;
  cursor: pointer;
  padding: 0;
}

.button:focus {
  outline: none;
}

.button:active:not(.disabled) {
  transform: scale(0.98);
}

/* Size variants */
.short {
  width: 122px;
  height: 39px;
}

.wide {
  width: 259px;
  height: 39px;
}

/* SVG positioning */
.svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Fill colors - Primary variant */
.primary .path {
  fill: #003712;
  transition: fill 300ms ease-out;
}

.primary:active:not(.disabled) .path {
  fill: #003712; /* TODO: Get press color from Figma if different */
}

@media (hover: hover) {
  .primary:hover:not(.disabled) .path {
    fill: #2c8c3e;
  }
}

/* Fill colors - Secondary variant */
.secondary .path {
  fill: #FFFFFF; /* TODO: Confirm with Figma */
  transition: fill 300ms ease-out;
}

.secondary:active:not(.disabled) .path {
  fill: #F0F0F0; /* TODO: Get from Figma */
}

@media (hover: hover) {
  .secondary:hover:not(.disabled) .path {
    fill: #E8E8E8; /* TODO: Get from Figma */
  }
}

/* Text label */
.text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: 'Figtree', var(--font-ibm-plex), -apple-system, sans-serif;
  font-weight: 700;
  font-size: 13px;
  line-height: 1.2;
  color: #FFFFFF;
  text-align: center;
  padding: 0 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  position: relative;
  z-index: 1;
}

.secondary .text {
  color: #003712;
}

@media (hover: hover) {
  .secondary:hover:not(.disabled) .text {
    color: #2C8C3E;
  }
}

/* Disabled state */
.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### 3. Challenge.module.css

**Update `.buttonGroup`:**

```css
.buttonGroup {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  padding: 0 1rem;  /* ADD - prevents edge touching */
}

/* DELETE .buttonGroup button rules completely */
```

---

### 4. Submit.module.css

**Update `.buttonGroup`:**

```css
.buttonGroup {
  display: flex;
  gap: 0.75rem;  /* CHANGE from 0.6rem */
  justify-content: center;
  max-width: 320px;  /* CHANGE from 400px */
  margin: 0 auto;
  padding: 0 1rem;  /* ADD */
}

/* DELETE .buttonGroup button rules completely */
```

---

### 5. CameraCapture.module.css

**Update `.controls`:**

```css
.controls {
  display: flex;
  gap: 0.75rem;  /* CHANGE from 1rem */
  justify-content: center;
  flex-wrap: nowrap;
  max-width: 320px;  /* CHANGE from 500px */
  margin: 0 auto;
  padding: 0 1rem;  /* ADD */
}

/* DELETE .controls button rules completely */
```

---

### 6. Update Component Usages

Add `size="short"` prop to all buttons except welcome page:

**app/challenge/[id]/page.tsx:**
```tsx
<GrassyButton size="short" variant="primary" onClick={...}>
  Join Challenge
</GrassyButton>

<GrassyButton size="short" variant="secondary" onClick={...}>
  View Chain
</GrassyButton>
```

**app/submit/page.tsx:**
```tsx
<GrassyButton size="short" variant="primary" onClick={handleSubmit}>
  Submit
</GrassyButton>

<GrassyButton size="short" variant="secondary" onClick={handleReset}>
  Retake
</GrassyButton>
```

**app/components/CameraCapture.tsx:**
```tsx
<GrassyButton size="short" variant="primary" onClick={...}>
  Open Camera
</GrassyButton>

<GrassyButton size="short" variant="primary" onClick={capturePhoto}>
  Capture
</GrassyButton>

<GrassyButton size="short" variant="secondary" onClick={stopCamera}>
  Cancel
</GrassyButton>
```

---

### 7. Delete Old Asset Files

Remove these 4 files:
- `/public/assets/grassy-button-primary.svg`
- `/public/assets/grassy-button-primary-hover.svg`
- `/public/assets/grassy-button-secondary.svg`
- `/public/assets/grassy-button-secondary-hover.svg`

---

## Expected Results

✅ **Fixes mobile spacing** - 1rem padding prevents edge touching
✅ **Fixes viewport overflow** - 320px max containers fit small screens
✅ **Consistent button sizes** - Only 122px or 259px (not 3+ variations)
✅ **Consistent padding feel** - Same width = same visual padding ratio
✅ **Clean architecture** - Component controls sizing, pages just pass prop
✅ **CSS-only interactions** - No JS state, hover/active via pseudo-classes
✅ **Smaller bundle** - Inline SVG minifies with JS, no asset files
✅ **Easy updates** - Copy/paste from Figma directly into constants

---

## TODO Before Implementation

- [ ] Get short button SVG paths from Figma (primary & secondary)
- [ ] Confirm secondary button fill colors for all states
- [ ] Confirm if press/active state uses different colors than normal state
