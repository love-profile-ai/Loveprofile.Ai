import Link from "next/link";
import { Heart, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-4 z-30 mb-6 flex items-center justify-between floating-nav">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight"
      >
        <span className="grid size-9 place-items-center rounded-full border border-primary/30 bg-gradient-to-br from-primary/20 via-lavender/15 to-coral/15 shadow-sm shadow-primary/15 dark:border-primary/40 dark:from-primary/25 dark:via-lavender/20 dark:to-coral/15">
          <Heart className="size-4 fill-primary/30 text-primary dark:fill-primary/40" />
        </span>
        <span>
          <span className="text-foreground">LoveProfile</span>{" "}
          <span className="bg-gradient-to-r from-primary via-lavender to-coral bg-clip-text font-bold text-transparent">
            AI
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <ThemeToggle />
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/55 transition-colors hover:text-primary"
        >
          <LayoutDashboard className="size-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </div>
    </header>
  );
}
