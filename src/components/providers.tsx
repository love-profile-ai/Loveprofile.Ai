"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ApprovalGate } from "@/components/auth/approval-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ApprovalGate>{children}</ApprovalGate>
    </NextThemesProvider>
  );
}
