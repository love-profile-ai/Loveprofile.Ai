"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      <Card className="glass-card rounded-3xl">
        <CardHeader>
          <CardTitle className="font-display text-xl font-semibold tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium leading-relaxed text-foreground/72">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

export function FlagsList({
  flags,
  type,
}: {
  flags: string[];
  type: "green" | "red";
}) {
  const Icon = type === "green" ? CheckCircle2 : AlertTriangle;

  if (flags.length === 0) {
    return <p className="text-sm text-muted-foreground">None identified.</p>;
  }

  return (
    <ul className="space-y-3">
      {flags.map((flag) => (
        <li
          key={flag}
          className={cn(
            "flex items-start gap-3 rounded-2xl p-4 text-sm font-semibold leading-relaxed",
            type === "green" ? "flag-green" : "flag-red"
          )}
        >
          <Icon className="mt-0.5 size-4 shrink-0" />
          <span>{flag}</span>
        </li>
      ))}
    </ul>
  );
}
