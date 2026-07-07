import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#insights", label: "Insights" },
  { href: "/dashboard", label: "Dashboard" },
];

export function LandingNavbar() {
  return (
    <header className="sticky top-4 z-30 mx-auto mt-4 flex max-w-6xl items-center justify-between floating-nav py-3">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground"
      >
        <span className="grid size-9 place-items-center rounded-full border border-primary/15 bg-primary/10 shadow-inner shadow-primary/10">
          <span className="grid grid-cols-2 gap-0.5">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="size-1.5 rounded-full bg-gold" />
            <span className="size-1.5 rounded-full bg-coral" />
            <span className="size-1.5 rounded-full bg-primary/45" />
          </span>
        </span>
        Signal
      </Link>

      <nav className="hidden items-center gap-7 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-semibold text-foreground/56 transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/login"
          className="hidden text-sm font-semibold text-foreground/62 transition-colors hover:text-primary sm:inline"
        >
          Sign in
        </Link>
        <Link href="/disclaimer">
          <Button size="sm" variant="outline" className="px-4">
            Get started
          </Button>
        </Link>
      </div>
    </header>
  );
}
