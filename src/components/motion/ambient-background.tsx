"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const SPARKLES = [
  { left: "6%", top: "14%", size: 3, delay: 0 },
  { left: "18%", top: "72%", size: 2, delay: 1.2 },
  { left: "34%", top: "28%", size: 2.5, delay: 0.6 },
  { left: "52%", top: "8%", size: 2, delay: 2.1 },
  { left: "68%", top: "58%", size: 3, delay: 0.9 },
  { left: "82%", top: "22%", size: 2, delay: 1.8 },
  { left: "91%", top: "78%", size: 2.5, delay: 0.3 },
  { left: "44%", top: "88%", size: 2, delay: 2.6 },
] as const;

interface AmbientBackgroundProps {
  className?: string;
  intensity?: "soft" | "medium";
}

export function AmbientBackground({
  className,
  intensity = "soft",
}: AmbientBackgroundProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          "ambient-blob ambient-blob-rose",
          intensity === "medium" && "opacity-80"
        )}
      />
      <div className="ambient-blob ambient-blob-lavender" />
      <div className="ambient-blob ambient-blob-gold" />

      {!reduced &&
        SPARKLES.map((sparkle, index) => (
          <span
            key={index}
            className="ambient-sparkle"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: `${sparkle.delay}s`,
            }}
          />
        ))}
    </div>
  );
}
