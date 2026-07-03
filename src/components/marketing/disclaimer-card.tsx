"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, ArrowRight, Check, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptDisclaimer, DISCLAIMER_TEXT } from "@/lib/disclaimer";
import { cn } from "@/lib/utils";

interface DisclaimerCardProps {
  onContinue?: () => void;
  continueHref?: string;
  className?: string;
}

export function DisclaimerCard({
  onContinue,
  continueHref = "/analyze",
  className,
}: DisclaimerCardProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  function handleContinue() {
    if (!agreed) return;
    acceptDisclaimer();
    if (onContinue) {
      onContinue();
    } else {
      router.push(continueHref);
    }
  }

  return (
    <div className={cn("w-full max-w-xl text-left", className)}>
      <div className="glass-card overflow-hidden">
        <div className="border-b border-primary/15 bg-gradient-to-r from-primary/10 via-pink-100/40 to-rose-100/30 px-6 py-4 dark:from-primary/15 dark:via-primary/5 dark:to-transparent">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/80 shadow-sm dark:bg-card/80">
              <Info className="size-4 text-primary" strokeWidth={2.25} />
            </span>
            <h2 className="text-section-title text-primary/80">Quick Disclaimer</h2>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto px-6 py-5 text-[0.9rem] font-medium leading-[1.7] tracking-[0.01em] text-foreground/65">
          {DISCLAIMER_TEXT.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mb-3.5 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        <label
          className={cn(
            "sign-box block cursor-pointer",
            agreed && "sign-box-checked"
          )}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="sr-only"
          />
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "sign-checkbox mt-0.5",
                agreed && "sign-checkbox-checked"
              )}
              aria-hidden
            >
              {agreed ? (
                <Check className="size-3.5 stroke-[3]" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/70">
                <PenLine className="size-3.5" />
                Your acknowledgment
              </span>
              <span className="mt-1.5 block text-sm font-bold leading-snug text-foreground">
                I understand that the results depend on my responses.
              </span>
              <span className="mt-1 block text-xs font-medium text-foreground/55">
                Tap to sign and unlock the assessment
              </span>
            </div>
          </div>
        </label>
      </div>

      <Button
        size="lg"
        disabled={!agreed}
        onClick={handleContinue}
        className="btn-cta text-btn-label mt-6 h-12 w-full rounded-xl text-base tracking-wide disabled:opacity-60 sm:rounded-full"
      >
        Continue Assessment
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}
