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
    title: "Do I Love Someone?",
    description:
      "For when you stare at the ceiling wondering if it's love, crush, or delulu.",
    bullets: [
      "Name the feeling without a TED Talk",
      "Spot your emotional patterns (yes, all of them)",
      "Love vs crush vs admiration — pick your fighter",
    ],
    accent: "accent-rose",
    gradient: "from-primary/14 via-lavender/8 to-transparent",
  },
  {
    id: "someone_likes_me" as const,
    icon: Eye,
    title: "Does Someone Love Me?",
    description: "For decoding their texts, silences, and suspiciously cute behavior.",
    bullets: [
      "Translate mixed signals into plain English",
      "Green flags, red flags, beige flags",
      "Interest level: probably not 'just friends'",
    ],
    accent: "accent-coral",
    gradient: "from-coral/12 via-gold/8 to-transparent",
  },
];

const steps = [
  {
    icon: MessageCircleHeart,
    title: "Tell the truth (ish)",
    description: "~17 adaptive questions — no trick questions, just vibes",
  },
  {
    icon: Brain,
    title: "AI does the math",
    description: "Trust, reciprocity, communication chaos — analyzed",
  },
  {
    icon: Sparkles,
    title: "Get the report",
    description: "Colorful insights, flags, and advice with personality",
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
      <div className="pointer-events-none absolute bottom-[18%] right-[8%] -z-10 hidden size-64 rounded-full bg-blush-wash/50 blur-3xl lg:block dark:bg-primary/10" />
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
            Pick your <em className="text-display-accent">drama arc.</em>
          </h1>
          <p className="text-lead mx-auto mt-4 max-w-2xl">
            Choose a path. Answer honestly-ish. Get a report that feels like gossip
            from a smart friend — not a courtroom cross-exam.
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
                className={`premium-card group relative h-full cursor-pointer overflow-hidden p-2 ${path.accent}`}
                onClick={() => !loading && onStart(path.id)}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${path.gradient} opacity-90`}
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
                        Start the chaos
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
          ~17 Questions · ~5 Minutes · Admin-approved members only
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
              A playful flow for romantic overthinkers — not a job interview.
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
            Your answers stay private. Take your time — we are not timing your
            emotional spiral.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
