import { PageBackdrop } from "@/components/motion/page-backdrop";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  wide = false,
  dotGrid = true,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  dotGrid?: boolean;
}) {
  return (
    <div className="premium-shell luxury-grain">
      <PageBackdrop dotGrid={dotGrid} />
      <div
        className={cn(
          "relative z-10 mx-auto w-full px-4 sm:px-6",
          wide ? "max-w-6xl" : "max-w-3xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
