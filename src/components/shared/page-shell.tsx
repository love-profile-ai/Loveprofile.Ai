import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          wide ? "max-w-4xl" : "max-w-3xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
