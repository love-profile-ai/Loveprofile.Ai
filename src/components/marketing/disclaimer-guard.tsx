"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasAcceptedDisclaimer } from "@/lib/disclaimer";
import { Loader2 } from "lucide-react";

/** Redirects to /disclaimer if not yet accepted. */
export function DisclaimerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasAcceptedDisclaimer()) {
      router.replace("/disclaimer");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
