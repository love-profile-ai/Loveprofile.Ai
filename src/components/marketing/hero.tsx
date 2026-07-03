"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-48 w-48 rounded-full bg-pink-200/30 blur-3xl dark:bg-primary/10" />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm dark:bg-card/70"
      >
        AI Relationship Analyst
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.1]"
      >
        Discover What Your{" "}
        <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
          Relationship Signals
        </span>{" "}
        Really Mean
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
      >
        AI analyzes conversations, emotions, communication patterns and relationship
        behaviors — without simplistic scores or yes/no answers.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10"
      >
        <Link href="/analyze">
          <Button size="lg" className="h-12 rounded-full bg-primary px-8 text-base shadow-lg shadow-primary/25 hover:bg-primary/90">
            Start Analysis
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
