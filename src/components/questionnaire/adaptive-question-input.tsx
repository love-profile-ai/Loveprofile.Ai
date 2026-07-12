"use client";



import type { Question, QuestionOption, SliderOptions } from "@/types/adaptive-engine";

import { cn } from "@/lib/utils";

import { Check } from "lucide-react";



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

        {options.map((option) => {

          const selected = value === option.value;

          return (

            <button

              key={option.value}

              type="button"

              onClick={() => onChange(option.value)}

              className={cn(

                "answer-card flex items-center gap-4",

                selected && "answer-card-selected"

              )}

            >

              <span

                className={cn(

                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",

                  selected

                    ? "border-primary bg-primary text-foreground"

                    : "border-foreground/15"

                )}

              >

                {selected && <Check className="size-3.5 stroke-[3]" />}

              </span>

              <span>{option.label}</span>

            </button>

          );

        })}

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

            <button

              key={option.value}

              type="button"

              onClick={() => {

                if (active) {

                  onChange(selected.filter((v) => v !== option.value));

                } else {

                  onChange([...selected, option.value]);

                }

              }}

              className={cn(

                "answer-card flex items-center gap-4",

                active && "answer-card-selected"

              )}

            >

              <span

                className={cn(

                  "flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all",

                  active

                    ? "border-primary bg-primary text-foreground"

                    : "border-foreground/15"

                )}

              >

                {active && <Check className="size-3.5 stroke-[3]" />}

              </span>

              <span>{option.label}</span>

            </button>

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

      <div className="glass-card space-y-6 p-7">

        <div className="flex justify-between text-sm font-semibold text-foreground/55">

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

          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/15 accent-primary"

        />

        {!hasValue && (

          <p className="text-center text-sm font-medium text-foreground/55">

            Slide to share how you feel

          </p>

        )}

      </div>

    );

  }



  return null;

}

