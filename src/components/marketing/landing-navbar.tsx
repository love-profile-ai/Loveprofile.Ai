"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#themes", label: "Themes" },
  { href: "#insights", label: "Preview" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-4 z-30 mx-auto mt-4 flex max-w-6xl items-center justify-between floating-nav",
        scrolled && "floating-nav-scrolled"
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight transition-transform duration-300 hover:scale-[1.02]"
      >
        <span className="grid size-9 place-items-center rounded-full border border-primary/30 bg-gradient-to-br from-primary/20 via-lavender/15 to-coral/15 shadow-sm shadow-primary/15 transition-shadow duration-300 hover:shadow-md hover:shadow-primary/20 dark:border-primary/40 dark:from-primary/25 dark:via-lavender/20 dark:to-coral/15">
          <Heart className="size-4 fill-primary/30 text-primary dark:fill-primary/40" />
        </span>
        <span className="text-foreground">
          <span className="text-foreground">LoveProfile</span>{" "}
          <span className="bg-gradient-to-r from-primary via-lavender to-coral bg-clip-text font-bold text-transparent">
            AI
          </span>
        </span>
      </Link>

      <nav className="hidden items-center gap-6 lg:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="nav-link-premium">
            {link.label}
          </Link>
        ))}
        <Link href="/login?next=/dashboard" className="nav-link-premium">
          Dashboard
        </Link>
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <Link href="/login" className="nav-link-premium hidden sm:inline">
          Sign in
        </Link>
        <Link href="/login">
          <Button size="sm" className="btn-cta rounded-full px-5 text-xs">
            Sign in
          </Button>
        </Link>
      </div>
    </header>
  );
}
