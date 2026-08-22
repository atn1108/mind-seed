import type { Transition, Variants } from "motion/react";

/** Shared ease-out curve — decelerates smoothly without overshoot. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Gentle spring for hover/entrance of larger surfaces. */
export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 26 };

/** Snappy spring for small controls (chips, checkboxes, stars). */
export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 30 };

export type PageInVariants = Variants;

export const pageIn: PageInVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Parent that staggers fadeInUp children. */
export const staggerParent = (stagger = 0.06): Variants => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger } },
});
