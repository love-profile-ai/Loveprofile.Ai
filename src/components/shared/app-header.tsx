import Link from "next/link";
import { Heart, LayoutDashboard, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SITE_NAME } from "@/lib/site";

export function AppHeader() {
  return (
    <header className="sticky top-4 z-30 mb-6 flex items-center justify-between rounded-full border border-white/55 bg-white/65 px-4 py-3 shadow-xl shadow-primary/8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/30">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground"
      >
        <span className="flex size-9 items-center justify-center rounded-full border border-primary/15 bg-primary/10 shadow-inner shadow-primary/10">
          <Heart className="size-4 fill-primary text-primary" />
        </span>
        {SITE_NAME}
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80 transition-colors hover:text-primary"
        >
          <LayoutDashboard className="size-3.5" />
          Dashboard
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-full px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80 transition-colors hover:text-primary"
        >
          <Shield className="size-3.5" />
          Admin
        </Link>
      </div>
    </header>
  );
}
