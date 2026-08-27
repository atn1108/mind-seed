import type { Transition, Variants } from "motion/react";

/** Ultra-smooth modern easing curve. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Silky spring for hover/entrance. */
export const springSoft: Transition = { type: "spring", stiffness: 300, damping: 28 };

/** Snappy spring for small controls (chips, checkboxes, stars). */
export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 30 };

export type PageInVariants = Variants;

export const pageIn: PageInVariants = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

/** Parent that staggers fadeInUp children. */
export const staggerParent = (stagger = 0.05): Variants => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger } },
});
