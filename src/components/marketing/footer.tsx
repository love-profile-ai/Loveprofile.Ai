import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div className="text-center sm:text-left">
          <p className="font-display text-lg font-semibold">{SITE_NAME}</p>
          <p className="mt-1 text-sm font-medium text-foreground/52">{SITE_TAGLINE}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-foreground/55">
          <Link href="/disclaimer" className="transition-colors hover:text-primary">
            Begin
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link href="/login" className="transition-colors hover:text-primary">
            Sign in
          </Link>
        </div>
        <p className="text-xs font-medium text-foreground/42">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
