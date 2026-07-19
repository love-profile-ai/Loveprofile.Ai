export const motionEase = [0.22, 1, 0.36, 1] as const;

export const motionSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const pageEnter = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: motionEase },
};
