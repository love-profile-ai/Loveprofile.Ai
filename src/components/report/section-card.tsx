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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display text-lg font-bold tracking-[-0.01em]">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium leading-relaxed text-foreground/75">{children}</CardContent>
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
  const color = type === "green" ? "text-green-600" : "text-red-500";

  if (flags.length === 0) {
    return <p className="text-sm text-muted-foreground">None identified.</p>;
  }

  return (
    <ul className="space-y-2">
      {flags.map((flag) => (
        <li key={flag} className="flex items-start gap-2 text-base font-medium">
          <Icon className={cn("mt-0.5 size-4 shrink-0", color)} />
          <span>{flag}</span>
        </li>
      ))}
    </ul>
  );
}
