"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { Footer } from "@/components/marketing/footer";
import { FadeInView } from "@/components/motion/fade-in-view";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Lock,
  Eye,
  TrendingUp,
} from "lucide-react";
import { SITE_NAME } from "@/lib/site";

const NilaOrb = dynamic(
  () => import("@/components/marketing/nila-orb").then((m) => m.NilaOrb),
  { ssr: false, loading: () => <div className="h-[420px] w-full animate-pulse rounded-full bg-primary/8" /> }
);

const howItWorks = [
  {
    step: "01",
    title: "Share your story",
    description: "Answer gentle, adaptive questions that respond to what you reveal — never a rigid checklist.",
    icon: MessageCircle,
    accent: "accent-rose",
  },
  {
    step: "02",
    title: "LoveProfile reads the patterns",
    description: "Our engine maps emotional consistency, trust, communication, and closeness across dimensions.",
    icon: Sparkles,
    accent: "accent-gold",
  },
  {
    step: "03",
    title: "Receive your reflection",
    description: "A magazine-style report with a personal AI summary and compassionate next steps.",
    icon: Heart,
    accent: "accent-lavender",
  },
];

const themes = [
  {
    title: "Communication",
    description: "How you express needs, listen, and repair after tension.",
    accent: "accent-rose",
    color: "#D4788A",
  },
  {
    title: "Trust",
    description: "Consistency, reliability, and emotional safety over time.",
    accent: "accent-gold",
    color: "#D4A84A",
  },
  {
    title: "Closeness",
    description: "Intimacy, affection, and the rhythm of staying connected.",
    accent: "accent-lavender",
    color: "#9B87C8",
  },
  {
    title: "Conflict",
    description: "How disagreements surface, escalate, and resolve.",
    accent: "accent-coral",
    color: "#E8785A",
  },
];

const testimonials = [
  {
    quote: "It felt like opening a private journal — not filling out a form.",
    author: "Maya, 28",
  },
  {
    quote: "The report was gentle but honest. I finally understood the mixed signals.",
    author: "James, 34",
  },
  {
    quote: "Beautiful design. I kept reading the report twice because it felt so personal.",
    author: "Priya, 31",
  },
];

const faqs = [
  {
    q: "Is this therapy or medical advice?",
    a: `No. ${SITE_NAME} is a self-reflection tool for educational purposes. It helps you organize what you already feel — it does not diagnose or replace professional support.`,
  },
  {
    q: "Do I need an account?",
    a: "You can start as a guest instantly. Sign in only when you want to save reports across devices.",
  },
  {
    q: "Is my data private?",
    a: "Your answers stay private by default. We never create public profiles or share your reflections.",
  },
  {
    q: "How long does it take?",
    a: "Most reflections take 5–10 minutes. The engine adapts — some paths are shorter, some go deeper.",
  },
];

export function LandingHero() {
  return (
    <div className="landing-canvas">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <LandingNavbar />

      <main className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Hero — asymmetrical */}
        <section className="hero-romantic-panel grid items-center gap-8 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-4 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 max-w-xl"
          >
            <p className="text-label">Your private relationship journal</p>
            <h1 className="text-display mt-5">
              Understand the patterns beneath your{" "}
              <span className="text-display-accent">feelings.</span>
            </h1>
            <p className="text-lead mt-6">
              {SITE_NAME} guides you through a calm, romantic reflection — and
              returns a thoughtful report that reads like discovery, not diagnosis.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/disclaimer">
                <Button size="lg" className="btn-cta h-14 w-full sm:w-auto">
                  Begin reflection
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="btn-outline-romantic h-14 rounded-full px-8">
                  Sign in to save
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { label: "Private by default", color: "from-teal/15 to-teal/5 border-teal/25 text-teal dark:from-teal/20 dark:to-teal/8 dark:border-teal/35 dark:text-teal" },
                { label: "No scoring people", color: "from-lavender/20 to-lavender/5 border-lavender/30 text-lavender dark:from-lavender/25 dark:to-lavender/8 dark:border-lavender/40 dark:text-lavender" },
                { label: "5 min guided path", color: "from-primary/18 to-coral/8 border-primary/25 text-primary dark:from-primary/22 dark:to-coral/10 dark:border-primary/35 dark:text-primary" },
              ].map((t) => (
                <span
                  key={t.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r px-3 py-1.5 text-xs font-bold ${t.color}`}
                >
                  <Shield className="size-3.5 shrink-0 opacity-80" />
                  {t.label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.8, ease: "easeOut" }}
            className="relative z-10 h-[380px] sm:h-[440px] lg:h-[520px]"
          >
            <NilaOrb className="absolute inset-0 h-full w-full" />
          </motion.div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-label">How it works</p>
            <h2 className="text-heading-page mt-3">
              Three gentle steps to clarity.
            </h2>
          </FadeInView>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {howItWorks.map((item, i) => (
              <FadeInView key={item.title} delay={i * 0.08}>
                <div className={`premium-card p-7 ${item.accent}`}>
                  <span className={`section-icon flex size-12 items-center justify-center rounded-2xl`}>
                    <item.icon className="size-5" />
                  </span>
                  <p className="text-meta-footer mt-6">{item.step}</p>
                  <h3 className="font-display mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="card-muted mt-3">
                    {item.description}
                  </p>
                </div>
              </FadeInView>
            ))}
          </div>
        </section>

        {/* Relationship themes */}
        <section id="themes" className="py-20">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-label">What we explore</p>
            <h2 className="text-heading-page mt-3">
              Four dimensions of connection.
            </h2>
          </FadeInView>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {themes.map((theme, i) => (
              <FadeInView key={theme.title} delay={i * 0.06}>
                <div
                  className={`premium-card p-7 ${theme.accent}`}
                  style={{ borderColor: `${theme.color}33` }}
                >
                  <div
                    className="mb-4 h-1 w-12 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${theme.color}, transparent)` }}
                  />
                  <h3 className="font-display text-2xl font-semibold">{theme.title}</h3>
                  <p className="card-muted mt-3">
                    {theme.description}
                  </p>
                </div>
              </FadeInView>
            ))}
          </div>
        </section>

        {/* Sample report preview */}
        <section id="insights" className="py-20">
          <FadeInView>
            <div className="report-canvas overflow-hidden p-6 sm:p-10">
              <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-label">Sample report</p>
                  <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
                    Mixed signals, gently clarified.
                  </h2>
                  <p className="text-lead mt-5 max-w-lg">
                    Your report opens with a hero summary, confidence score, and
                    the one observation that matters most.
                  </p>
                  <blockquote className="mt-8 rounded-3xl border border-primary/15 bg-primary/8 p-6 font-display text-xl italic leading-relaxed text-foreground/82">
                    &ldquo;There is warmth here — but clarity will come from
                    consistency, not guessing.&rdquo;
                  </blockquote>
                </div>

                <div className="space-y-4">
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground/65">Confidence</span>
                      <span className="font-display text-3xl font-semibold text-primary">78%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/12">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "78%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-primary via-coral to-gold"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-1">
                    <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-lavender/8 to-coral/6 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Your reflection</p>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground/78">
                        There is warmth in how you answered — but clarity will come from consistency, not guessing.
                      </p>
                    </div>
                  </div>

                  <div className="glass-card flex items-start gap-3 p-5">
                    <Eye className="mt-0.5 size-5 shrink-0 text-teal" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground/50">Key observation</p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground/75">
                        You invest more emotional labor than you receive back.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeInView>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-label">Voices</p>
            <h2 className="text-heading-page mt-3">Reflection, not interrogation.</h2>
          </FadeInView>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeInView key={t.author} delay={i * 0.08}>
                <div className="floating-card p-6">
                  <div className="mb-4 flex gap-1 text-gold">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="size-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm font-medium leading-7 text-foreground/72">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-foreground/42">
                    {t.author}
                  </p>
                </div>
              </FadeInView>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-label">Questions</p>
            <h2 className="text-heading-page mt-3">Before you begin.</h2>
          </FadeInView>
          <FadeInView className="mx-auto mt-10 max-w-2xl">
            <Accordion className="space-y-3">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.q}
                  value={faq.q}
                  className="glass-card rounded-3xl border px-6"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-medium leading-7 text-foreground/65">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeInView>
        </section>

        {/* Footer CTA */}
        <section className="py-20">
          <FadeInView>
            <div className="premium-card relative overflow-hidden p-10 text-center sm:p-14">
              <div className="absolute -right-20 -top-20 size-64 rounded-full bg-lavender/20 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 size-52 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative">
                <TrendingUp className="mx-auto size-8 text-gold" />
                <h2 className="font-display mt-6 text-3xl font-semibold sm:text-4xl">
                  Ready to understand what you feel?
                </h2>
                <p className="text-lead mx-auto mt-4 max-w-md">
                  Start your private reflection. No account required.
                </p>
                <Link href="/disclaimer" className="mt-8 inline-block">
                  <Button size="lg" className="btn-cta h-14 px-10">
                    Begin with {SITE_NAME}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/45">
                  <Lock className="size-3.5" />
                  Encrypted · Private · Not medical advice
                </p>
              </div>
            </div>
          </FadeInView>
        </section>
      </main>

      <Footer />
    </div>
  );
}
