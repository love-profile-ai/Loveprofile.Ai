"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Heart } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/75 backdrop-blur-xl dark:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Heart className="size-5 fill-primary text-primary" />
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              Admin
            </Button>
          </Link>
          <Link href="/analyze">
            <Button size="sm">Start Analysis</Button>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
