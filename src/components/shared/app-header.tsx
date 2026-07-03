import Link from "next/link";
import { Heart } from "lucide-react";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between py-5">
      <Link
        href="/"
        className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Heart className="size-4 fill-primary text-primary" />
        </span>
        Signal
      </Link>
      <Link
        href="/dashboard"
        className="text-label text-primary/80 hover:text-primary"
      >
        Dashboard
      </Link>
    </header>
  );
}
