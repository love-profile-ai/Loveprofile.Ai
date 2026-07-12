"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DisclaimerCard } from "@/components/marketing/disclaimer-card";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { FadeInView } from "@/components/motion/fade-in-view";
import { hasAcceptedDisclaimer } from "@/lib/disclaimer";
import { SITE_NAME } from "@/lib/site";
import { Heart, Shield, Sparkles } from "lucide-react";

const safetyCards = [
  {
    icon: Sparkles,
    title: "Self Reflection",
    description: "A guided journal for understanding your relationship patterns — not a diagnosis.",
    accent: "accent-rose",
  },
  {
    icon: Heart,
    title: "Not Medical Advice",
    description: `${SITE_NAME} supports thoughtful reflection. It does not replace therapy or professional care.`,
    accent: "accent-gold",
  },
  {
    icon: Shield,
    title: "Privacy Protected",
    description: "Your answers stay private. No public profiles, no sharing without your consent.",
    accent: "accent-teal",
  },
];

export default function DisclaimerPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasAcceptedDisclaimer()) {
      router.replace("/analyze");
    }
  }, [router]);

  return (
    <div className="landing-canvas">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <LandingNavbar />

      <div className="relative mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeInView className="text-center">
          <p className="text-label">Before we begin</p>
          <h1 className="text-heading-page mt-4">
            A calm boundary before your{" "}
            <em className="text-display-accent">reflection.</em>
          </h1>
          <p className="text-lead mx-auto mt-5 max-w-lg">
            Three things to know. Then one tap to continue into your private
            assessment.
          </p>
        </FadeInView>

        {/* Timeline-style safety cards */}
        <div className="relative mt-14 space-y-6">
          <div className="absolute left-6 top-8 bottom-8 hidden w-px bg-gradient-to-b from-primary/30 via-lavender/20 to-teal/30 sm:block" />
          {safetyCards.map((card, i) => (
            <FadeInView key={card.title} delay={i * 0.1}>
              <motion.div
                className={`premium-card relative flex gap-5 p-6 sm:pl-16 ${card.accent}`}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25 }}
              >
                <span className="absolute left-4 top-8 hidden size-4 rounded-full border-2 border-primary bg-background sm:block" />
                <span className={`section-icon flex size-12 shrink-0 items-center justify-center rounded-2xl`}>
                  <card.icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">{card.title}</h2>
                  <p className="card-muted mt-2">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            </FadeInView>
          ))}
        </div>

        <FadeInView className="mt-12">
          <DisclaimerCard continueHref="/analyze" />
        </FadeInView>
      </div>
    </div>
  );
}
