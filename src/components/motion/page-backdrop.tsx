import { AmbientBackground } from "@/components/motion/ambient-background";
import { cn } from "@/lib/utils";

interface PageBackdropProps {
  className?: string;
  dotGrid?: boolean;
  sparkles?: boolean;
  intensity?: "soft" | "medium";
}

export function PageBackdrop({
  className,
  dotGrid = true,
  sparkles = true,
  intensity = "soft",
}: PageBackdropProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10", className)}>
      <div className="luxury-grain absolute inset-0" />
      {dotGrid && <div className="dot-grid absolute inset-0" />}
      <div className="page-glow absolute inset-0" />
      {sparkles && (
        <AmbientBackground className="absolute inset-0" intensity={intensity} />
      )}
    </div>
  );
}
