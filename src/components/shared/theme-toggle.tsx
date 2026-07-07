"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <span
        aria-hidden
        className="inline-flex size-9 rounded-full border border-primary/20"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-9 items-center justify-center rounded-full border border-primary/20 bg-white/80 text-foreground/70 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:text-primary dark:border-primary/45 dark:bg-primary/15 dark:text-primary dark:shadow-md dark:shadow-primary/20 dark:hover:border-primary/60 dark:hover:bg-primary/25 dark:hover:shadow-lg dark:hover:shadow-primary/30"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
