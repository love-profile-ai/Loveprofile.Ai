"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Curves hugging the left viewport edge */
const LEFT_CURVES = [
  { d: "M -20 60 C 50 90, 80 150, 45 230 S 20 340, -15 420", color: "#D4788A", width: 3.6, opacity: 0.52 },
  { d: "M -30 180 C 40 210, 70 280, 35 360 S 10 460, -25 540", color: "#9B87C8", width: 3.3, opacity: 0.46 },
  { d: "M -10 320 C 55 350, 85 420, 50 500 S 25 600, -5 680", color: "#E8785A", width: 3.2, opacity: 0.44 },
  { d: "M -25 480 C 35 510, 65 580, 30 660", color: "#D4A84A", width: 3, opacity: 0.4 },
  { d: "M -15 120 C 30 155, 55 210, 25 280", color: "#FF8FAB", width: 2.8, opacity: 0.38 },
] as const;

/** Curves hugging the right viewport edge */
const RIGHT_CURVES = [
  { d: "M 1020 80 C 950 120, 920 190, 955 270 S 980 380, 1015 460", color: "#FF8FAB", width: 3.6, opacity: 0.52 },
  { d: "M 1030 200 C 960 240, 930 310, 965 390 S 990 500, 1025 580", color: "#C9A0E8", width: 3.3, opacity: 0.46 },
  { d: "M 1010 340 C 945 375, 915 445, 950 525 S 975 635, 1005 715", color: "#F2926F", width: 3.2, opacity: 0.44 },
  { d: "M 1025 500 C 965 530, 935 600, 970 680", color: "#B9AEDE", width: 3, opacity: 0.4 },
  { d: "M 1015 140 C 970 175, 945 230, 975 300", color: "#D4788A", width: 2.8, opacity: 0.38 },
] as const;

/** Curves along the top edge */
const TOP_CURVES = [
  { d: "M 80 -20 C 140 50, 220 70, 300 40 S 460 10, 540 -15", color: "#D4788A", width: 3.4, opacity: 0.48 },
  { d: "M 620 -25 C 680 45, 760 65, 840 35 S 1000 5, 1080 -18", color: "#9B87C8", width: 3.2, opacity: 0.42 },
  { d: "M 200 -10 C 260 55, 340 60, 420 30", color: "#E8785A", width: 3, opacity: 0.38 },
  { d: "M 400 -15 C 460 40, 540 55, 620 25", color: "#D4A84A", width: 2.8, opacity: 0.36 },
] as const;

/** Curves along the bottom edge */
const BOTTOM_CURVES = [
  { d: "M 60 820 C 120 760, 200 745, 280 775 S 440 805, 520 790", color: "#D4A84A", width: 3.4, opacity: 0.48 },
  { d: "M 580 830 C 640 770, 720 755, 800 785 S 960 815, 1040 800", color: "#FF8FAB", width: 3.2, opacity: 0.42 },
  { d: "M 340 810 C 400 755, 480 750, 560 780", color: "#C9A0E8", width: 3, opacity: 0.38 },
  { d: "M 120 815 C 180 770, 260 760, 340 785", color: "#F2926F", width: 2.8, opacity: 0.36 },
] as const;

const CORNER_ARCS = [
  { cx: 0, cy: 0, r: 200, start: 0, color: "#D4788A", opacity: 0.26 },
  { cx: 1000, cy: 0, r: 185, start: 90, color: "#9B87C8", opacity: 0.24 },
  { cx: 0, cy: 800, r: 195, start: 270, color: "#E8785A", opacity: 0.24 },
  { cx: 1000, cy: 800, r: 175, start: 180, color: "#D4A84A", opacity: 0.22 },
] as const;

const ALL_CURVES = [...LEFT_CURVES, ...RIGHT_CURVES, ...TOP_CURVES, ...BOTTOM_CURVES];

function cornerArcPath(cx: number, cy: number, r: number, startDeg: number) {
  const start = (startDeg * Math.PI) / 180;
  const end = start + Math.PI / 2;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

interface RomanticCurvePatternProps {
  className?: string;
}

/** Edge-hugging curve pattern for the full viewport */
export function RomanticCurvePattern({ className }: RomanticCurvePatternProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 1000 800"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id={`edge-fade-${uid}`} cx="50%" cy="48%" r="56%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="48%" stopColor="white" stopOpacity="0" />
            <stop offset="72%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </radialGradient>
          <mask id={`curve-mask-${uid}`}>
            <rect width="1000" height="800" fill={`url(#edge-fade-${uid})`} />
          </mask>
        </defs>

        <g mask={`url(#curve-mask-${uid})`}>
          {CORNER_ARCS.map((arc) => (
            <path
              key={`${arc.cx}-${arc.cy}`}
              d={cornerArcPath(arc.cx, arc.cy, arc.r, arc.start)}
              fill="none"
              stroke={arc.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity={arc.opacity}
            />
          ))}

          {ALL_CURVES.map((curve, i) => (
            <motion.path
              key={curve.d}
              d={curve.d}
              fill="none"
              stroke={curve.color}
              strokeWidth={curve.width}
              strokeLinecap="round"
              opacity={curve.opacity}
              initial={false}
              animate={
                reduced
                  ? undefined
                  : {
                      opacity: [curve.opacity, curve.opacity * 1.18, curve.opacity],
                    }
              }
              transition={{
                duration: 5 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
