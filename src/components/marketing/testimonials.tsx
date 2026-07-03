"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "This felt like talking to a thoughtful therapist, not taking a BuzzFeed quiz. The mixed signals section was spot on.",
    author: "Maya, 24",
  },
  {
    quote:
      "I appreciated that it never said 'they definitely love you.' The uncertainty was honest, and the follow-up chat helped a lot.",
    author: "James, 28",
  },
  {
    quote:
      "The attachment style analysis made me see patterns I had been ignoring. Way more useful than a percentage score.",
    author: "Priya, 31",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
        What people are saying
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.author}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full rounded-2xl border-primary/10 bg-white/80 shadow-sm shadow-primary/5 dark:bg-card/80">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium">{t.author}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
