"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-label text-[10px] tracking-[0.18em]">
        <span>
          Question {current} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <Progress value={percent} className="h-2.5 bg-primary/10" />
    </div>
  );
}
