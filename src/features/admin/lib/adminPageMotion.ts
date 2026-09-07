export const ADMIN_PAGE_EASE = [0.22, 1, 0.36, 1] as const;

export const adminPageEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: ADMIN_PAGE_EASE },
};

export const adminPageEnterReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15 },
};

export const adminStaggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const adminStaggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: ADMIN_PAGE_EASE },
  },
};

export const adminStaggerItemReduced = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.12 },
  },
};
