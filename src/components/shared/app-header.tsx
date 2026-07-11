import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SITE_NAME } from "@/lib/site";

export function AppHeader() {
  return (
    <header className="sticky top-4 z-30 mb-6 flex items-center justify-between floating-nav">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground"
      >
        <span className="grid size-9 place-items-center rounded-full border border-primary/20 bg-primary/12">
          <span className="size-3 rounded-full bg-gradient-to-br from-primary via-lavender to-coral" />
        </span>
        {SITE_NAME}
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
