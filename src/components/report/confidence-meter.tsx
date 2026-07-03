"use client";

import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/types/report";

const levels: Record<ConfidenceLevel, number> = {
  Low: 33,
  Medium: 66,
  High: 90,
};

export function ConfidenceMeter({ confidence }: { confidence: ConfidenceLevel }) {
  const value = levels[confidence] ?? 50;

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
