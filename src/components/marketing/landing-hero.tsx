"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  LockKeyhole,
  MessageCircleHeart,
  Sparkles,
  Star,
} from "lucide-react";

const stats = [
  { value: "5 min", label: "guided reflection" },
  { value: "17+", label: "adaptive prompts" },
  { value: "Private", label: "by default" },
];

const features = [
  {
    icon: MessageCircleHeart,
    title: "Emotionally intelligent questions",
    description:
      "A calm, guided path that helps you describe trust, connection, communication, and uncertainty.",
  },
  {
    icon: Sparkles,
    title: "A report that reads beautifully",
    description:
      "Your results are organized into signals, flags, next steps, and a compassionate summary.",
  },
  {
    icon: LockKeyhole,
    title: "Private reflection first",
    description:
      "Start as a guest, keep answers local when needed, and choose when to sign in for saved reports.",
  },
];

const testimonials = [
  "It felt like a thoughtful friend helped me organize what I already knew.",
  "The report was gentle, clear, and surprisingly useful.",
  "Finally, a relationship tool that doesn't feel like a quiz from 2012.",
];

export function LandingHero() {
  return (
    <div className="landing-canvas">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <LandingNavbar />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:pt-16">
        <section className="relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 max-w-3xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/58 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
              <Star className="size-3.5 fill-gold text-gold" />
              Premium relationship insight
            </div>

            <h1 className="text-display">
              Understand the signals beneath the{" "}
              <span className="text-display-accent">feelings.</span>
            </h1>

            <p className="text-lead mt-6 max-w-xl">
              Signal turns your story into a private, thoughtful relationship
              analysis — helping you reflect with warmth, clarity, and emotional
              intelligence.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/disclaimer">
                <Button size="lg" className="btn-cta h-13 px-8">
                  Begin reflection
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-13 px-8">
                  Sign in to save
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-foreground/60">
              {["No judgement", "No public profiles", "Built for reflection"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary" />
                    {item}
                  </span>
                )
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.7, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="premium-card relative overflow-hidden p-5 sm:p-7">
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/18 blur-3xl" />
              <div className="absolute -bottom-20 left-10 size-52 rounded-full bg-gold/16 blur-3xl" />

              <div className="relative rounded-[1.6rem] border border-white/65 bg-white/65 p-6 shadow-inner shadow-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label">Insight preview</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold">
                      Mixed signals, clarified
                    </h2>
                  </div>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Heart className="size-5 fill-primary/20" />
                  </span>
                </div>

                <div className="mt-8 grid gap-3">
                  {[
                    ["Emotional consistency", "78%"],
                    ["Communication warmth", "64%"],
                    ["Trust potential", "82%"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-foreground/70">
                        <span>{label}</span>
                        <span className="text-primary">{value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: value }}
                          transition={{ delay: 0.45, duration: 1 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary via-coral to-gold"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <blockquote className="mt-8 rounded-2xl border border-primary/10 bg-primary/7 p-5 font-display text-xl italic leading-relaxed text-foreground/82">
                  "There is warmth here, but clarity will come from consistency —
                  not guessing."
                </blockquote>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-4 border-y border-primary/10 py-7 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="font-display text-3xl font-semibold text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/45">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-label">How it works</p>
            <h2 className="text-heading-page mt-3">
              A softer way to understand what you feel.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08 }}
                className="premium-card p-6"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-7 text-foreground/62">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="insights" className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="premium-card p-7">
            <p className="text-label">Trusted tone</p>
            <h2 className="text-heading-page mt-3">Designed for real emotions.</h2>
            <p className="text-lead mt-5">
              No scoring people. No sensational claims. Just a polished,
              structured report that helps you reflect, decide, and communicate
              more clearly.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((quote) => (
              <div key={quote} className="floating-card p-5">
                <div className="mb-4 flex gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-gold" />
                  ))}
                </div>
                <p className="text-sm font-medium leading-7 text-foreground/70">
                  "{quote}"
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
