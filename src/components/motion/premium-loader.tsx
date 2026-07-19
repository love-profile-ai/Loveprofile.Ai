"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface PremiumLoaderProps {
  className?: string;
  label?: string;
}

export function PremiumLoader({
  className,
  label = "Loading",
}: PremiumLoaderProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 text-sm font-medium text-foreground/60",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <span className="size-8 rounded-full border-2 border-primary/25 border-t-primary" />
        {label}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative size-12">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary/15"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/30 via-lavender/20 to-coral/25"
          animate={{ scale: [1, 1.08, 1], opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="absolute inset-[18px] rounded-full bg-primary/80 shadow-[0_0_18px_rgba(212,120,138,0.45)]" />
      </div>
      <p className="text-sm font-semibold tracking-wide text-foreground/55">
        {label}
      </p>
    </div>
  );
}
