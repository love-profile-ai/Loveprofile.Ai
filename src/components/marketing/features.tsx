"use client";

import { motion } from "framer-motion";
import { Brain, FileText, Lock, MessageCircleHeart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI Reasoning",
    description:
      "No hardcoded scores. Our AI reads your full story and reasons like a psychologist — not a quiz.",
  },
  {
    icon: FileText,
    title: "Personalized Report",
    description:
      "Get 10+ sections covering attachment style, mixed signals, green flags, red flags, and advice.",
  },
  {
    icon: MessageCircleHeart,
    title: "Relationship Psychology",
    description:
      "Analysis grounded in communication patterns, emotional availability, trust, and reciprocity.",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    description:
      "Your answers stay private. Sign in to save reports, or start anonymously — your choice.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mb-12 rounded-3xl bg-white/50 px-6 py-10 text-center backdrop-blur-sm dark:bg-card/30">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          More than a quiz
        </h2>
        <p className="mt-3 text-muted-foreground">
          Real psychological analysis, powered by AI reasoning.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full rounded-2xl border-primary/10 bg-white/80 shadow-sm shadow-primary/5 backdrop-blur-sm dark:bg-card/80">
              <CardHeader>
                <feature.icon className="mb-2 size-8 text-primary" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
