"use client";

import { useId } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface GlossyBeatingHeartProps {
  className?: string;
  size?: number;
}

export function GlossyBeatingHeart({
  className,
  size = 140,
}: GlossyBeatingHeartProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();

  const heartGradId = `heartGrad-${uid}`;
  const glowId = `glow-${uid}`;
  const softId = `soft-${uid}`;

  return (
    <div
      className={cn("pointer-events-none select-none", className)}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="overflow-visible drop-shadow-[0_0_28px_rgba(255,79,139,0.45)]"
      >
        <defs>
          <radialGradient id={heartGradId} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ff9ec7" />
            <stop offset="35%" stopColor="#ff4f8b" />
            <stop offset="70%" stopColor="#e21e63" />
            <stop offset="100%" stopColor="#a1114a" />
          </radialGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff5b95" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff5b95" stopOpacity="0" />
          </radialGradient>
          <filter id={softId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <g
          className={reduced ? undefined : "animate-heartbeat"}
          style={{ transformOrigin: "100px 105px" }}
        >
          <ellipse cx="100" cy="105" rx="95" ry="95" fill={`url(#${glowId})`} />
          <path
            d="M100,175 C40,130 10,95 10,60 C10,30 32,10 58,10 C78,10 92,22 100,38 C108,22 122,10 142,10 C168,10 190,30 190,60 C190,95 160,130 100,175 Z"
            fill={`url(#${heartGradId})`}
            stroke="#7a0d38"
            strokeWidth="1"
          />
          <path
            d="M45,45 C55,32 72,25 85,27 C75,30 62,38 54,52 C50,60 48,68 49,76 C42,68 40,55 45,45 Z"
            fill="#ffffff"
            opacity="0.55"
            filter={`url(#${softId})`}
          />
          <circle cx="150" cy="45" r="4" fill="#fff" opacity="0.9" />
          <path
            d="M150,32 L152,42 L162,44 L152,46 L150,56 L148,46 L138,44 L148,42 Z"
            fill="#fff"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
}
