"use client";

import { cn } from "@/lib/utils";
import { CONFIDENCE_PERCENT } from "@/lib/report-theme";
import type { ConfidenceLevel } from "@/types/report";

export function ConfidenceMeter({
  confidence,
  variant = "bar",
}: {
  confidence: ConfidenceLevel;
  variant?: "bar" | "ring";
}) {
  const value = CONFIDENCE_PERCENT[confidence] ?? 50;

  if (variant === "ring") {
    const r = 36;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex items-center gap-4">
        <div className="relative size-[5.5rem] shrink-0">
          <svg viewBox="0 0 88 88" className="size-full -rotate-90">
            <circle
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              className="text-primary/12"
            />
            <circle
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke="url(#confidenceGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(0.62 0.19 355)" />
                <stop offset="100%" stopColor="oklch(0.75 0.14 330)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
            {value}%
          </span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary/80">
            Confidence level
          </p>
          <p className="font-display text-xl font-bold text-foreground">
            {confidence}
          </p>
          <p className="text-sm font-medium text-foreground/50">
            Based on your answers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-label text-primary/70">Confidence</span>
        <span className="text-sm font-bold text-foreground">{confidence}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-primary/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary/70 to-pink-400",
            confidence === "High" && "from-primary to-pink-400",
            confidence === "Medium" && "from-primary/80 to-pink-300",
            confidence === "Low" && "from-primary/50 to-pink-200"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ConfidenceBarsDecor() {
  const bars = [
    { h: "h-16", color: "bg-violet-400/70" },
    { h: "h-24", color: "bg-primary/60" },
    { h: "h-12", color: "bg-orange-300/80" },
  ];
  return (
    <div className="hidden items-end justify-center gap-2 sm:flex" aria-hidden>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn("w-5 rounded-t-lg", bar.h, bar.color)}
        />
      ))}
    </div>
  );
}
