"use client";

import { useId } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface GlossyBeatingHeartProps {
  className?: string;
  size?: number;
  vivid?: boolean;
}

export function GlossyBeatingHeart({
  className,
  size = 140,
  vivid = false,
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
          <linearGradient id={heartGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {vivid ? (
              <>
                <stop offset="0%" stopColor="#FF9EC7" />
                <stop offset="22%" stopColor="#FF4F8B" />
                <stop offset="48%" stopColor="#E8785A" />
                <stop offset="68%" stopColor="#9B87C8" />
                <stop offset="88%" stopColor="#D4A84A" />
                <stop offset="100%" stopColor="#C21E63" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ff9ec7" />
                <stop offset="35%" stopColor="#ff4f8b" />
                <stop offset="70%" stopColor="#e21e63" />
                <stop offset="100%" stopColor="#a1114a" />
              </>
            )}
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={vivid ? "#C9A0E8" : "#ff5b95"} stopOpacity="0.55" />
            <stop offset="55%" stopColor={vivid ? "#FF6B9D" : "#ff5b95"} stopOpacity="0.22" />
            <stop offset="100%" stopColor={vivid ? "#E8785A" : "#ff5b95"} stopOpacity="0" />
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
            stroke={vivid ? "#7a2d58" : "#7a0d38"}
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
