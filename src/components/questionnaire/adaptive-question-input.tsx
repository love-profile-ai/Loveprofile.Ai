"use client";

import { Button } from "@/components/ui/button";
import type { Question, QuestionOption, SliderOptions } from "@/types/adaptive-engine";
import { cn } from "@/lib/utils";

interface AdaptiveQuestionInputProps {
  question: Question;
  value: string | number | string[] | undefined;
  onChange: (value: string | number | string[]) => void;
}

export function isAdaptiveAnswerValid(
  question: Question,
  value: string | number | string[] | undefined
): boolean {
  if (value === undefined) return false;

  switch (question.type) {
    case "slider":
      return typeof value === "number";
    case "single_select":
      return typeof value === "string" && value.length > 0;
    case "multi_select":
      return Array.isArray(value) && value.length > 0;
    default:
      return false;
  }
}

export function AdaptiveQuestionInput({
  question,
  value,
  onChange,
}: AdaptiveQuestionInputProps) {
  if (question.type === "single_select") {
    const options = question.options as QuestionOption[];
    return (
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            className={cn(
              "h-auto justify-start rounded-2xl px-5 py-5 text-left text-base font-semibold leading-relaxed",
              value === option.value &&
                "ring-2 ring-primary/35 shadow-lg shadow-primary/15 dark:ring-primary/55"
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  if (question.type === "multi_select") {
    const options = question.options as QuestionOption[];
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <Button
              key={option.value}
              variant={active ? "default" : "outline"}
              className={cn(
                "h-auto justify-start rounded-2xl px-5 py-5 text-left text-base font-semibold leading-relaxed",
                active && "ring-2 ring-primary/35 shadow-lg shadow-primary/15"
              )}
              onClick={() => {
                if (active) {
                  onChange(selected.filter((v) => v !== option.value));
                } else {
                  onChange([...selected, option.value]);
                }
              }}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    );
  }

  if (question.type === "slider") {
    const opts = question.options as SliderOptions;
    const hasValue = typeof value === "number";
    const current = hasValue ? value : opts.min;
    return (
      <div className="space-y-5 rounded-2xl border border-primary/10 bg-white/35 p-5 backdrop-blur-xl dark:bg-white/[0.04]">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{opts.min}</span>
          <span className="font-display text-5xl font-semibold text-primary">
            {current}
          </span>
          <span>{opts.max}</span>
        </div>
        <input
          type="range"
          min={opts.min}
          max={opts.max}
          value={current}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full accent-primary"
        />
        {!hasValue && (
          <p className="text-sm font-medium text-primary/70">
            Move the slider to choose your answer
          </p>
        )}
      </div>
    );
  }

  return null;
}
