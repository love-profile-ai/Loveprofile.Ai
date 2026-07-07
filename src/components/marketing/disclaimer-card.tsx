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
    <div className={cn("w-full max-w-2xl text-left", className)}>
      <div className="premium-card overflow-hidden">
        <div className="border-b border-primary/12 bg-gradient-to-r from-primary/10 via-blush/50 to-gold/10 px-6 py-5 dark:from-primary/16 dark:via-white/[0.035] dark:to-gold/8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/70 shadow-sm dark:bg-white/[0.07]">
              <Info className="size-4 text-primary" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-label">Before you begin</p>
              <h2 className="font-display text-xl font-semibold">Quick Disclaimer</h2>
            </div>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto px-6 py-6 text-[0.95rem] font-medium leading-[1.85] tracking-[0.01em] text-foreground/66">
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
        className="btn-cta mt-6 h-12 w-full text-base disabled:opacity-60"
      >
        Continue Assessment
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}
