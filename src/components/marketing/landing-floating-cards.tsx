"use client";

import { motion } from "framer-motion";
import { Check, Clock, Heart, MessageCircle, Sparkles } from "lucide-react";

function FloatCard({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        className="floating-card"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function LandingFloatingCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      <FloatCard
        delay={0.1}
        className="absolute left-[4%] top-[18%] w-52 xl:left-[8%] xl:w-56"
      >
        <div className="relative rotate-[-3deg] rounded-xl bg-gradient-to-br from-primary/20 via-pink-100 to-rose-50 p-4 shadow-lg shadow-primary/15 dark:via-primary/15 dark:to-primary/5">
          <span className="absolute -right-1 -top-1 size-3 rounded-full bg-primary shadow-sm" />
          <p className="text-xs font-semibold leading-relaxed text-foreground/75">
            Reflect on trust, communication, and the signals that matter most to you.
          </p>
        </div>
        <div className="absolute -bottom-3 -right-3 flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-white shadow-md dark:bg-card">
          <Check className="size-5 text-primary" strokeWidth={2.5} />
        </div>
      </FloatCard>

      <FloatCard
        delay={0.2}
        className="absolute right-[4%] top-[16%] w-56 xl:right-[8%] xl:w-60"
      >
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
              Your session
            </span>
          </div>
          <p className="font-display text-sm font-bold text-foreground">Quick assessment</p>
          <p className="mt-1 text-xs font-medium text-foreground/55">~17 questions · ~5 min</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-primary/50 to-pink-400/70" />
          </div>
        </div>
      </FloatCard>

      <FloatCard
        delay={0.3}
        className="absolute bottom-[22%] left-[6%] w-56 xl:left-[10%] xl:w-64"
      >
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground/50">
            Today&apos;s focus
          </p>
          <ul className="mt-3 space-y-2.5">
            {[
              { label: "Communication patterns", pct: 72 },
              { label: "Emotional signals", pct: 58 },
            ].map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
                  <span className="text-[10px] font-bold text-primary/70">{item.pct}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/45 to-pink-400/60"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </FloatCard>

      <FloatCard
        delay={0.15}
        className="absolute bottom-[20%] right-[6%] w-52 xl:right-[10%] xl:w-56"
      >
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
              Report includes
            </span>
          </div>
          <div className="flex gap-2">
            {[Heart, MessageCircle, Check].map((Icon, i) => (
              <span
                key={i}
                className="flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-white/90 shadow-sm dark:bg-card/90"
              >
                <Icon className="size-4 text-primary" />
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-foreground/55">
            Green flags, advice & outlook
          </p>
        </div>
      </FloatCard>
    </div>
  );
}
