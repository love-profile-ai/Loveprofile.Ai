"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ApprovalGate } from "@/components/auth/approval-gate";
import { CursorHeartTrail } from "@/components/shared/cursor-heart-trail";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ApprovalGate>
        <CursorHeartTrail />
        {children}
      </ApprovalGate>
    </NextThemesProvider>
  );
}
