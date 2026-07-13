"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ApprovalGate } from "@/components/auth/approval-gate";
import { CursorHeartTrail } from "@/components/shared/cursor-heart-trail";
import { RomanticCurvePattern } from "@/components/marketing/romantic-curve-pattern";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ApprovalGate>
        <RomanticCurvePattern />
        <CursorHeartTrail />
        <div className="relative z-[1]">{children}</div>
      </ApprovalGate>
    </NextThemesProvider>
  );
}
