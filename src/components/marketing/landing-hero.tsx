"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingFloatingCards } from "@/components/marketing/landing-floating-cards";
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
  PartyPopper,
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
    title: "Spill the tea (privately)",
    description:
      "Answer playful, adaptive questions that follow your drama — not a boring checklist from 2009.",
    icon: MessageCircle,
    accent: "accent-rose",
  },
  {
    step: "02",
    title: "AI reads the vibes",
    description:
      "We map trust, mixed signals, communication chaos, and emotional math across your answers.",
    icon: Sparkles,
    accent: "accent-gold",
  },
  {
    step: "03",
    title: "Get your roast… lovingly",
    description:
      "A colorful report with insights, flags, and advice that feels like a witty friend — not a courtroom.",
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
    quote: "Felt like texting a friend who actually listens — not taking a job interview about my crush.",
    author: "Maya, 28",
  },
  {
    quote: "The report called out my situationship with kindness. Rude, but accurate.",
    author: "James, 34",
  },
  {
    quote: "Pretty enough to screenshot. Chaotic enough to feel real.",
    author: "Priya, 31",
  },
];

const faqs = [
  {
    q: "Is this therapy?",
    a: `Nope. ${SITE_NAME} is for fun self-reflection and educational giggles — not diagnosis, not legal advice, not a substitute for a real therapist.`,
  },
  {
    q: "Can I sneak in as a guest?",
    a: "No guest mode. Sign in with Google or email, get approved by admin, then enter. VIP energy only.",
  },
  {
    q: "Is my data private?",
    a: "Your answers stay yours. We are not building a public leaderboard of heartbreak.",
  },
  {
    q: "How long does it take?",
    a: "About 5–10 minutes — roughly one playlist of emotionally unhinged pop songs.",
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
          <LandingFloatingCards />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 max-w-xl"
          >
            <p className="text-label">Not a serious app (on purpose)</p>
            <h1 className="text-display mt-5">
              Decode your love chaos with a side of{" "}
              <span className="text-display-accent">fun.</span>
            </h1>
            <p className="text-lead mt-6">
              {SITE_NAME} turns your romantic overthinking into a colorful AI report —
              sign in, get admin-approved, then let the vibes get analyzed.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="btn-cta h-14 w-full sm:w-auto">
                  Sign in to get started
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { label: "No guest sneak-ins", color: "from-teal/18 to-teal/6 border-teal/30 text-teal dark:from-teal/20 dark:to-teal/8 dark:border-teal/35 dark:text-teal" },
                { label: "Admin-approved only", color: "from-lavender/22 to-lavender/8 border-lavender/35 text-lavender dark:from-lavender/25 dark:to-lavender/8 dark:border-lavender/40 dark:text-lavender" },
                { label: "~5 min of drama", color: "from-primary/20 to-coral/10 border-primary/30 text-primary dark:from-primary/22 dark:to-coral/10 dark:border-primary/35 dark:text-primary" },
              ].map((t) => (
                <span
                  key={t.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r px-3 py-1.5 text-xs font-bold ${t.color}`}
                >
                  <PartyPopper className="size-3.5 shrink-0 opacity-80" />
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
              Three steps. Zero boring forms.
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
                    Mixed signals, comically clarified.
                  </h2>
                  <p className="text-lead mt-5 max-w-lg">
                    Your report opens with a vibe check, a confidence meter, and
                    the one observation that makes you go &ldquo;…oh.&rdquo;
                  </p>
                  <blockquote className="mt-8 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/12 via-lavender/8 to-coral/8 p-6 font-display text-xl italic leading-relaxed text-foreground/82">
                    &ldquo;There is warmth here — but clarity will come from
                    consistency, not decoding emojis at 2 a.m.&rdquo;
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
            <h2 className="text-heading-page mt-3">Chaos, but make it cute.</h2>
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
                  Ready to overthink with style?
                </h2>
                <p className="text-lead mx-auto mt-4 max-w-md">
                  Sign in, wait for admin approval, then let the AI translate your
                  romantic nonsense into something readable.
                </p>
                <Link href="/login" className="mt-8 inline-block">
                  <Button size="lg" className="btn-cta h-14 px-10">
                    Sign in to {SITE_NAME}
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
