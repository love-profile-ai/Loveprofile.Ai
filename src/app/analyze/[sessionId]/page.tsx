import { Suspense } from "react";
import SessionPageClient from "./session-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-16">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      }
    >
      <SessionPageClient params={params} />
    </Suspense>
  );
}
