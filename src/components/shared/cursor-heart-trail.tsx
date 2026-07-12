"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useTheme } from "next-themes";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const HEART_COLORS = {
  light: ["#E8A5B0", "#FF8FAB", "#F2926F", "#B9AEDE"],
  dark: ["#FF8FAB", "#E8A5B0", "#C9A0E8", "#F2926F"],
} as const;

interface TrailHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  driftX: number;
  rotation: number;
  lift: number;
}

let idCounter = 0;

/** Romantic heart trail that follows the cursor across the site */
export function CursorHeartTrail() {
  const [hearts, setHearts] = useState<TrailHeart[]>([]);
  const [enabled, setEnabled] = useState(false);
  const reduced = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const lastSpawn = useRef({ x: 0, y: 0, time: 0 });

  const palette = resolvedTheme === "dark" ? HEART_COLORS.dark : HEART_COLORS.light;

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    setEnabled(finePointer.matches);
    const handler = () => setEnabled(finePointer.matches);
    finePointer.addEventListener("change", handler);
    return () => finePointer.removeEventListener("change", handler);
  }, []);

  const removeHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const spawnHeart = useCallback(
    (x: number, y: number) => {
      const now = performance.now();
      const last = lastSpawn.current;
      const dist = Math.hypot(x - last.x, y - last.y);

      if (dist < 24 && now - last.time < 85) return;

      lastSpawn.current = { x, y, time: now };

      const heart: TrailHeart = {
        id: ++idCounter,
        x,
        y,
        size: 12 + Math.random() * 8,
        color: palette[Math.floor(Math.random() * palette.length)],
        driftX: (Math.random() - 0.5) * 26,
        rotation: (Math.random() - 0.5) * 28,
        lift: 34 + Math.random() * 26,
      };

      setHearts((prev) => [...prev.slice(-16), heart]);
    },
    [palette]
  );

  useEffect(() => {
    if (reduced || !enabled) return;

    const onMove = (e: MouseEvent) => spawnHeart(e.clientX, e.clientY);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, enabled, spawnHeart]);

  if (reduced || !enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.span
            key={heart.id}
            className="absolute text-primary"
            style={{
              left: heart.x,
              top: heart.y,
              color: heart.color,
              filter: "drop-shadow(0 2px 8px rgba(232, 165, 176, 0.42))",
            }}
            initial={{
              opacity: 0,
              scale: 0.2,
              x: "-50%",
              y: "-50%",
              rotate: 0,
            }}
            animate={{
              opacity: [0, 0.92, 0],
              scale: [0.25, 1.15, 0.5],
              x: `calc(-50% + ${heart.driftX}px)`,
              y: [`calc(-50% - 4px)`, `calc(-50% - ${heart.lift}px)`],
              rotate: heart.rotation,
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => removeHeart(heart.id)}
          >
            <Heart
              className="fill-current"
              style={{ width: heart.size, height: heart.size }}
              strokeWidth={1.25}
              stroke="currentColor"
            />
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
