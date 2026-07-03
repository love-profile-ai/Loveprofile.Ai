import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#disclaimer", label: "Disclaimer" },
  { href: "/dashboard", label: "Dashboard" },
];

export function LandingNavbar() {
  return (
    <header className="relative z-20 flex items-center justify-between py-5">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-foreground"
      >
        <span className="grid grid-cols-2 gap-0.5">
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-primary/35" />
          <span className="size-2 rounded-full bg-primary/35" />
          <span className="size-2 rounded-full bg-primary/35" />
        </span>
        Signal
      </Link>

      <nav className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-semibold text-foreground/55 transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-sm font-semibold text-foreground/60 hover:text-primary sm:inline"
        >
          Sign in
        </Link>
        <Link href="/login">
          <Button size="sm" variant="outline" className="rounded-full border-primary/25 px-4 font-semibold">
            Get started
          </Button>
        </Link>
      </div>
    </header>
  );
}
