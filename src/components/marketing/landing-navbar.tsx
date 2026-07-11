import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SITE_NAME } from "@/lib/site";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#themes", label: "Themes" },
  { href: "#insights", label: "Preview" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNavbar() {
  return (
    <header className="sticky top-4 z-30 mx-auto mt-4 flex max-w-6xl items-center justify-between floating-nav">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground"
      >
        <span className="grid size-9 place-items-center rounded-full border border-primary/20 bg-primary/12">
          <span className="size-3 rounded-full bg-gradient-to-br from-primary via-lavender to-coral animate-pulse-soft" />
        </span>
        {SITE_NAME}
      </Link>

      <nav className="hidden items-center gap-6 lg:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-semibold text-foreground/55 transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-foreground/55 transition-colors hover:text-primary"
        >
          Dashboard
        </Link>
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <Link
          href="/login"
          className="hidden text-sm font-semibold text-foreground/58 transition-colors hover:text-primary sm:inline"
        >
          Sign in
        </Link>
        <Link href="/disclaimer">
          <Button size="sm" className="btn-cta rounded-full px-5 text-xs">
            Begin
          </Button>
        </Link>
      </div>
    </header>
  );
}
