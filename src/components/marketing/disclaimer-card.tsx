"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Heart, Shield, Sparkles } from "lucide-react";
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
    <div className={cn("w-full text-left", className)}>
      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-lavender/8 to-gold/8 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="section-icon accent-rose flex size-11 items-center justify-center rounded-2xl">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-label">Consent</p>
              <h2 className="font-display text-xl font-semibold">Your acknowledgment</h2>
            </div>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto px-6 py-6 text-[0.95rem] font-medium leading-[1.85] text-foreground/65">
          {DISCLAIMER_TEXT.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mb-3.5 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        <label
          className={cn(
            "sign-box mx-4 mb-4 block cursor-pointer",
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
              {agreed ? <Check className="size-3.5 stroke-[3]" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/75">
                <Heart className="size-3.5" />
                I understand
              </span>
              <span className="mt-1.5 block text-sm font-bold leading-snug text-foreground">
                Results depend on my responses and are for self-reflection only.
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-foreground/52">
                <Shield className="size-3" />
                Tap to continue into your private assessment
              </span>
            </div>
          </div>
        </label>
      </div>

      <Button
        size="lg"
        disabled={!agreed}
        onClick={handleContinue}
        className="btn-cta mt-6 h-14 w-full rounded-full text-base disabled:opacity-50"
      >
        Continue to reflection
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}
