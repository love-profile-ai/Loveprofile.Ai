"use client";

import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInView({ children, className, delay = 0 }: FadeInViewProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
