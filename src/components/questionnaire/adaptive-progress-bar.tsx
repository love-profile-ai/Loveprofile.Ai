"use client";

import type { AssessmentPhase } from "@/types/adaptive-engine";
import { MAX_QUESTIONS } from "@/lib/engine/constants";

interface AdaptiveProgressBarProps {
  questionNumber: number;
  dimensionCoverage: number;
  phase: AssessmentPhase;
}

export function AdaptiveProgressBar({
  questionNumber,
  dimensionCoverage,
  phase,
}: AdaptiveProgressBarProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/45">
        {phase === "foundation" ? "Foundation reflection" : "Adaptive reflection"}
      </p>
      <p className="text-xs font-semibold text-foreground/50">
        Question {questionNumber} of {MAX_QUESTIONS}
        {phase === "foundation" ? " · Foundation" : ""} · {dimensionCoverage} dimensions
        explored
        {phase === "foundation"
          ? " · same gentle path for everyone"
          : " · order adapts to your answers"}
      </p>
    </div>
  );
}
