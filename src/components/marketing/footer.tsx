import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-white/50 py-12 dark:bg-background/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>
          {SITE_NAME} · {SITE_TAGLINE}
        </p>
        <div className="flex gap-6">
          <Link href="/analyze" className="hover:text-foreground">
            Analyze
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin" className="hover:text-foreground">
            Admin
          </Link>
        </div>
        <p>© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}
