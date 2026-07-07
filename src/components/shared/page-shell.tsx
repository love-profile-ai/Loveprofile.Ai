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
    <div className="premium-shell luxury-grain">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          wide ? "max-w-6xl" : "max-w-3xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
