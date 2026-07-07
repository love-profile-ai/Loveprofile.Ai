"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalysisPath } from "@/types/questionnaire";
import {
  ArrowRight,
  Brain,
  Eye,
  Flag,
  Heart,
  Loader2,
  MessageCircleHeart,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

const paths = [
  {
    id: "i_like_someone" as const,
    icon: Heart,
    title: "Do I love someone?",
    description:
      "Explore your own feelings — love, crush, admiration, or friendship",
    bullets: [
      "Clarify what you're really feeling",
      "Spot emotional patterns & attachment",
      "Understand if it's love, crush, or admiration",
    ],
    accent:
      "from-primary/16 via-blush/60 to-gold/10 dark:from-primary/20 dark:via-white/[0.04] dark:to-gold/8",
  },
  {
    id: "someone_likes_me" as const,
    icon: Eye,
    title: "Does someone love me?",
    description: "Decode their signals, behavior, and emotional connection",
    bullets: [
      "Read mixed signals with clarity",
      "See green flags & red flags",
      "Gauge their level of interest",
    ],
    accent:
      "from-coral/12 via-white/65 to-primary/10 dark:from-coral/15 dark:via-white/[0.035] dark:to-primary/10",
  },
];

const steps = [
  {
    icon: MessageCircleHeart,
    title: "Answer honestly",
    description: "~17 adaptive questions tailored to your situation",
  },
  {
    icon: Brain,
    title: "AI analyzes patterns",
    description: "Communication, trust, reciprocity & emotional signals",
  },
  {
    icon: Sparkles,
    title: "Get your report",
    description: "Personalized insights, flags, and thoughtful advice",
  },
];

const reportHighlights = [
  { icon: Heart, label: "Emotional connection" },
  { icon: Flag, label: "Green & red flags" },
  { icon: Zap, label: "Mixed signals" },
  { icon: Shield, label: "Private & secure" },
];

export function AnalyzePathSection({
  loading,
  onStart,
}: {
  loading: AnalysisPath | null;
  onStart: (path: AnalysisPath) => void;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -bottom-32 left-1/2 -z-10 h-96 w-[120%] -translate-x-1/2 rounded-[100%] bg-gradient-to-t from-primary/10 via-gold/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-[18%] right-[8%] -z-10 hidden size-64 rounded-full bg-rose-200/25 blur-3xl lg:block" />
      <div className="pointer-events-none absolute bottom-[28%] left-[6%] -z-10 hidden size-48 rounded-full bg-primary/10 blur-3xl lg:block" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-2 sm:px-6">
        <Link href="/" className="text-label text-primary/70 hover:text-primary">
          ← Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto mt-8 max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/58 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <Sparkles className="size-3" />
            Step 1 · Choose your path
          </span>
          <h1 className="text-heading-page mt-5">
            Choose the lens for your <em className="text-display-accent">reflection.</em>
          </h1>
          <p className="text-lead mx-auto mt-4 max-w-2xl">
            Choose the path that best describes you. Questions will adapt to your
            answer and build a report unique to your story.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {paths.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card
                className="premium-card group relative h-full cursor-pointer overflow-hidden p-2"
                onClick={() => !loading && onStart(path.id)}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${path.accent} opacity-80 transition-opacity group-hover:opacity-100`}
                />
                <CardHeader className="relative p-6 pb-2">
                  <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-white/70 shadow-lg shadow-primary/10 backdrop-blur-xl dark:bg-white/[0.07]">
                    <path.icon className="size-6 text-primary" />
                  </span>
                  <CardTitle className="font-display text-3xl font-semibold tracking-[-0.02em]">
                    {path.title}
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-foreground/70">
                    {path.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-6 p-6 pt-2">
                  <ul className="space-y-2">
                    {path.bullets.map((bullet) => (
                      <li
                        key={bullet}
                      className="flex items-start gap-2.5 text-sm font-semibold leading-6 text-foreground/64"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="btn-cta px-7"
                    disabled={!!loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart(path.id);
                    }}
                  >
                    {loading === path.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Start
                        <ArrowRight className="ml-1.5 size-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-meta-footer mt-10 text-center"
        >
          ~17 Questions · ~5 Minutes · Auto-saved
        </motion.p>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-16"
        >
          <div className="premium-card px-6 py-10 sm:px-10">
            <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
              How it <em className="text-display-accent">works</em>
            </h2>
            <p className="text-lead mx-auto mt-3 max-w-lg text-center">
              A thoughtful flow designed to help you reflect — not just score you.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="relative text-center">
                  {i < steps.length - 1 && (
                    <div className="pointer-events-none absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-primary/30 to-primary/10 sm:block" />
                  )}
                  <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-white/60 shadow-lg shadow-primary/8 backdrop-blur-xl dark:bg-white/[0.06]">
                    <step.icon className="size-6 text-primary" />
                  </span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-primary/70">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/60">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {reportHighlights.map((item) => (
            <div
              key={item.label}
              className="floating-card flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="size-4 text-primary" />
              </span>
              <p className="text-sm font-semibold text-foreground/75">{item.label}</p>
            </div>
          ))}
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-5 text-center"
        >
          <p className="text-sm font-medium text-foreground/65">
            Your answers stay private. Take your time — you can pause and come back
            anytime.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
