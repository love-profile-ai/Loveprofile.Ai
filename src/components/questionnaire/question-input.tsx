"use client";

import { Button } from "@/components/ui/button";
import type { Question } from "@/types/questionnaire";
import { cn } from "@/lib/utils";

interface QuestionInputProps {
  question: Question;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}

function StructuredInput({ question, value, onChange }: QuestionInputProps) {
  switch (question.type) {
    case "multiple_choice":
      return (
        <div className="flex flex-col gap-3">
          {question.options?.map((option) => (
            <Button
              key={option.value}
              variant={value === option.value ? "default" : "outline"}
              className={cn(
                "h-auto justify-start rounded-2xl px-5 py-5 text-left text-base font-semibold leading-relaxed",
                value === option.value &&
                  "ring-2 ring-primary/35 shadow-lg shadow-primary/15 dark:ring-primary/55 dark:shadow-primary/28"
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      );

    case "yes_no":
      return (
        <div className="flex gap-3">
          {[
            { label: "Yes", value: true },
            { label: "No", value: false },
          ].map((option) => (
            <Button
              key={String(option.value)}
              variant={value === option.value ? "default" : "outline"}
              className={cn(
                "flex-1 rounded-2xl py-7 text-base font-semibold",
                value === option.value &&
                  "ring-2 ring-primary/35 shadow-lg shadow-primary/15 dark:ring-primary/55 dark:shadow-primary/28"
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      );

    case "scale": {
      const min = question.min ?? 1;
      const max = question.max ?? 10;
      const hasValue = typeof value === "number";
      const current = hasValue ? value : min;
      return (
        <div className="space-y-5 rounded-2xl border border-primary/10 bg-white/35 p-5 backdrop-blur-xl dark:bg-white/[0.04]">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{min}</span>
            <span className="font-display text-5xl font-semibold text-primary">{current}</span>
            <span>{max}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
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

    case "emoji_scale":
      return (
        <div className="flex flex-col gap-3">
          {question.options?.map((option, i) => (
            <Button
              key={option.value}
              variant={value === option.value ? "default" : "outline"}
              className={cn(
                "h-auto justify-start gap-4 rounded-2xl px-5 py-5 text-left text-base font-semibold leading-relaxed",
                value === option.value &&
                  "ring-2 ring-primary/35 shadow-lg shadow-primary/15 dark:ring-primary/55 dark:shadow-primary/28"
              )}
              onClick={() => onChange(option.value)}
            >
              <span className="text-2xl">{question.emojis?.[i] ?? "•"}</span>
              {option.label}
            </Button>
          ))}
        </div>
      );

    default:
      return null;
  }
}

export function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  return <StructuredInput question={question} value={value} onChange={onChange} />;
}

export function isAnswerValid(
  question: Question,
  value: string | number | boolean | undefined
): boolean {
  const required = question.required !== false;

  if (!required && (value === undefined || value === "")) {
    return true;
  }

  switch (question.type) {
    case "scale":
      return typeof value === "number";
    case "yes_no":
      return typeof value === "boolean";
    case "multiple_choice":
    case "emoji_scale":
      return (
        typeof value === "string" &&
        (question.options?.some((o) => o.value === value) ?? false)
      );
    default:
      return value !== undefined && value !== "";
  }
}
