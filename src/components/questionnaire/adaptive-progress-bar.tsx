"use client";

interface AdaptiveProgressBarProps {
  questionNumber: number;
  confidence: number;
  dimensionCoverage: number;
}

export function AdaptiveProgressBar({
  questionNumber,
  confidence,
  dimensionCoverage,
}: AdaptiveProgressBarProps) {
  const confidencePct = Math.min(100, Math.round(confidence));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/45">
        <span>Adaptive reflection</span>
        <span>{confidencePct}% confidence</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-coral to-gold transition-all duration-500"
          style={{ width: `${Math.max(8, confidencePct)}%` }}
        />
      </div>
      <p className="text-xs font-semibold text-foreground/50">
        Question {questionNumber} · {dimensionCoverage} dimensions explored ·
        order adapts to your answers
      </p>
    </div>
  );
}
