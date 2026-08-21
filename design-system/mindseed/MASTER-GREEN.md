# MindSeed Design System - Green Theme Edition

> **Project:** MindSeed - Grow Your Focus  
> **Theme:** Green (Apple/Notion/Forest App inspired)  
> **Generated:** 2026-08-13  
> **Purpose:** UI cleanup with typography, spacing & component consistency

---

## 1. Color Palette (Green Theme - OKLCH)

### Primary Colors
- **Primary:** `oklch(0.703 0.157 148.5)` (#4CAF50) — Main green
- **Primary-Soft:** `oklch(0.945 0.045 152)` — Light green backgrounds
- **Secondary:** `oklch(0.807 0.105 149)` — Lighter green accents

### Accent & Status
- **Accent:** `oklch(0.879 0.135 88)` — Yellow/amber highlights
- **Destructive:** `oklch(0.62 0.2 25)` — Red warnings/errors

### Neutral
- **Background:** `oklch(0.988 0.014 155)` (light) / `oklch(0.19 0.02 155)` (dark)
- **Foreground:** `oklch(0.245 0.008 150)` (light) / `oklch(0.965 0.01 152)` (dark)
- **Muted:** `oklch(0.962 0.014 152)` (light) / `oklch(0.29 0.025 152)` (dark)
- **Border:** `oklch(0.925 0.018 152)` / `rgba(255,255,255,12%)`

---

## 2. Typography System

### Heading Hierarchy
```css
/* Display (Hero/Taglines) */
--font-size-display: 3.5rem;      /* 56px */
--font-weight-display: 700;
--line-height-display: 1.2;
--letter-spacing-display: -0.02em;

/* Heading 1 (Page titles) */
--font-size-h1: 2rem;              /* 32px */
--font-weight-h1: 600;
--line-height-h1: 1.3;
--letter-spacing-h1: -0.01em;

/* Heading 2 (Section titles) */
--font-size-h2: 1.5rem;            /* 24px */
--font-weight-h2: 600;
--line-height-h2: 1.35;
--letter-spacing-h2: -0.005em;

/* Heading 3 (Subsections) */
--font-size-h3: 1.25rem;           /* 20px */
--font-weight-h3: 600;
--line-height-h3: 1.4;

/* Body Large (Important content) */
--font-size-body-lg: 1.0625rem;    /* 17px */
--font-weight-body: 400;
--line-height-body: 1.5;
--letter-spacing-body: 0;

/* Body Regular (Default) */
--font-size-body: 1rem;            /* 16px */
--line-height-body: 1.5;

/* Body Small (Helper text) */
--font-size-body-sm: 0.875rem;     /* 14px */
--line-height-body-sm: 1.5;

/* Label/Caption */
--font-size-label: 0.75rem;        /* 12px */
--line-height-label: 1.4;
--font-weight-label: 500;
--letter-spacing-label: 0.005em;

/* Code/Mono */
--font-family-mono: "Monaco", "Menlo", monospace;
--font-size-code: 0.875rem;
--line-height-code: 1.6;
```

### Font Stack
- **Display & Headings:** Poppins, ui-sans-serif, system-ui, sans-serif
- **Body & UI:** Poppins, ui-sans-serif, system-ui, sans-serif
- **Monospace:** Monaco, Menlo, monospace

---

## 3. Spacing System

### Scale (based on 8px base)
```
--space-xs:    4px    (0.25rem)   — Tight, icon gaps
--space-sm:    8px    (0.5rem)    — Small gaps, inline
--space-md:    16px   (1rem)      — Standard padding
--space-lg:    24px   (1.5rem)    — Section padding
--space-xl:    32px   (2rem)      — Large containers
--space-2xl:   48px   (3rem)      — Section margins
--space-3xl:   64px   (4rem)      — Hero padding
```

### Recommended Usage
| Element | Padding | Margin | Gap |
|---------|---------|--------|-----|
| Button (vertical) | 12px | — | — |
| Button (horizontal) | 12-24px | — | — |
| Card | 24px (lg) / 16px (md) | 16px | — |
| Form Input | 12px | — | — |
| Form Group | — | 16px | 12px |
| Section | — | 48px | 24px |
| Grid item | — | — | 16px |

---

## 4. Border Radius

| Size | Value | Usage |
|------|-------|-------|
| --radius-sm | `calc(var(--radius) - 8px)` | Small buttons, tight components |
| --radius-md | `calc(var(--radius) - 4px)` | Form inputs |
| --radius-lg | `var(--radius)` (1.25rem = 20px) | Cards, standard |
| --radius-xl | `calc(var(--radius) + 6px)` (26px) | Large cards, modals |
| --radius-2xl | `calc(var(--radius) + 12px)` (32px) | Dialogs |
| --radius-3xl | `calc(var(--radius) + 20px)` (40px) | Hero sections |

---

## 5. Shadow System

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 24px rgba(0,0,0,0.12)` | Modals, floating |
| `--shadow-xl` | `0 20px 40px rgba(0,0,0,0.15)` | Featured content |
| `--shadow-glow` | `0 12px 40px oklch(0.72 0.17 145 / 0.32)` | Accent glow |

---

## 6. Component Specifications

### Buttons

#### Primary Button
```css
/* Default state */
background: oklch(0.703 0.157 148.5);     /* Primary green */
color: oklch(0.995 0.005 150);             /* White */
padding: 12px 24px;
border-radius: 10px;
font-weight: 600;
font-size: 15px;
border: none;
cursor: pointer;
transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);

/* Hover */
&:hover {
  background: oklch(0.66 0.15 148.5);      /* Darker green */
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Active */
&:active {
  transform: translateY(0);
}

/* Disabled */
&:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Focus */
&:focus-visible {
  outline: 2px solid oklch(0.703 0.157 148.5);
  outline-offset: 2px;
}
```

#### Secondary Button (Outline)
```css
background: transparent;
color: oklch(0.703 0.157 148.5);
border: 2px solid oklch(0.703 0.157 148.5);
padding: 10px 22px;
border-radius: 10px;
font-weight: 600;
transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);

&:hover {
  background: oklch(0.945 0.045 152);     /* Primary-soft */
  border-color: oklch(0.66 0.15 148.5);
}
```

### Form Inputs

```css
/* Base input */
background: oklch(1 0 0);
border: 1px solid oklch(0.925 0.018 152);
color: oklch(0.245 0.008 150);
padding: 12px 16px;
border-radius: 10px;
font-size: 16px;
font-family: inherit;
transition: all 150ms ease;

/* Focus */
&:focus {
  outline: none;
  border-color: oklch(0.703 0.157 148.5);
  box-shadow: inset 0 0 0 1px oklch(0.703 0.157 148.5),
              0 0 0 3px oklch(0.945 0.045 152);
}

/* Error */
&:invalid,
&[aria-invalid="true"] {
  border-color: oklch(0.62 0.2 25);
  background: oklch(0.62 0.2 25 / 0.05);
}

/* Dark mode */
.dark & {
  background: oklch(0.235 0.022 155);
  border-color: oklch(1 0 0 / 12%);
  color: oklch(0.965 0.01 152);
}

.dark &:focus {
  border-color: oklch(0.74 0.155 148.5);
  box-shadow: inset 0 0 0 1px oklch(0.74 0.155 148.5),
              0 0 0 3px oklch(0.3 0.05 152);
}
```

### Cards

```css
background: oklch(1 0 0);
border: 1px solid oklch(0.925 0.018 152);
border-radius: 20px;               /* --radius-lg */
padding: 24px;
box-shadow: var(--shadow-sm);
transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);

&:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Dark mode */
.dark & {
  background: oklch(0.235 0.022 155);
  border-color: oklch(1 0 0 / 12%);
}
```

---

## 7. Motion & Animation

### Transition Presets
- **Quick:** 150ms | Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- **Standard:** 200-300ms | Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- **Slow:** 400-500ms | Easing: `cubic-bezier(0.22, 1, 0.36, 1)`

### Key Principles
- ✓ Use cubic-bezier(0.22, 1, 0.36, 1) for natural easing
- ✓ Respect `prefers-reduced-motion` media query
- ✓ Max 300ms for interactions
- ✓ Stagger list items by 40-60ms
- ✓ Translate Y for lift effects (2-4px max)

### Common Effects

**Fade + Scale On Load**
```javascript
opacity: 0, scale: 0.92, y: 12
→ opacity: 1, scale: 1, y: 0
Duration: 300ms, Easing: back.out(1.4)
```

**Hover Lift**
```css
transform: translateY(-2px);
box-shadow: var(--shadow-md);
transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
```

---

## 8. Accessibility Checklist

- [ ] Text contrast: 4.5:1 minimum (WCAG AA)
- [ ] Focus states visible for all interactive elements
- [ ] Button min-size: 44×44px (touch), 40×40px (desktop)
- [ ] Icon-only buttons have aria-label
- [ ] Form labels associated with inputs
- [ ] Error messages linked to inputs (aria-describedby)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Heading hierarchy maintained (h1→h2→h3)
- [ ] Images have alt text
- [ ] Color not the only way to convey information
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Links distinguishable from text (underline or color)

---

## 9. Responsive Breakpoints

```
--breakpoint-xs: 320px   (Mobile small)
--breakpoint-sm: 640px   (Mobile / Tablet portrait)
--breakpoint-md: 768px   (Tablet)
--breakpoint-lg: 1024px  (Desktop)
--breakpoint-xl: 1280px  (Large desktop)
--breakpoint-2xl: 1536px (Extra large)
```

### Mobile-First Approach
- Base styles for 320px
- Medium screens (sm: 640px) — Adjust spacing
- Tablets (md: 768px) — Adjust layout
- Desktop (lg: 1024px) — Full layout

---

## 10. Anti-Patterns (❌ Avoid)

- ❌ Mixing border-radius styles (some 8px, some 16px)
- ❌ Inconsistent padding (some 12px, some 14px, some 18px)
- ❌ Text smaller than 14px for body content
- ❌ Line-height less than 1.5 for body text
- ❌ Hover effects without smooth transitions
- ❌ Color-only error states (add icon + text)
- ❌ Disabled state showing opacity only (add cursor-not-allowed)
- ❌ Animations with durations > 300ms
- ❌ Focus states that are invisible
- ❌ Links that don't look clickable

---

## 11. Pre-Delivery Checklist

- [ ] All headings use `font-weight: 600` or `700`
- [ ] Body text is 16px with 1.5 line-height
- [ ] All spacing uses `--space-*` scale
- [ ] All border-radius uses `--radius-*` variables
- [ ] All buttons have hover + focus states
- [ ] All inputs have focus + error states
- [ ] All cards use `--shadow-sm` minimum
- [ ] All transitions use standard easing preset
- [ ] Dark mode colors applied to all components
- [ ] No hardcoded colors in Tailwind classes (use design tokens)
- [ ] Responsive tested at 375px, 768px, 1024px, 1440px
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible on all interactive elements

---

## 12. CSS Variables Quick Reference

Add to your `:root` or component:

```css
/* Apply these to styles.css @theme section */
--font-size-display: 3.5rem;
--font-size-h1: 2rem;
--font-size-h2: 1.5rem;
--font-size-h3: 1.25rem;
--font-size-body-lg: 1.0625rem;
--font-size-body: 1rem;
--font-size-body-sm: 0.875rem;
--font-size-label: 0.75rem;

--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 10px 24px rgba(0,0,0,0.12);
--shadow-xl: 0 20px 40px rgba(0,0,0,0.15);
```

---

## Notes

This design system **complements** the existing green theme while improving:
- ✓ Typography consistency and readability
- ✓ Spacing system clarity
- ✓ Component state management
- ✓ Accessibility standards
- ✓ Motion and transitions

Apply these rules page by page to maintain consistency with your existing codebase.
