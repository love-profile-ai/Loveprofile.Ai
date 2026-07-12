"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useContainerSize } from "@/hooks/use-container-size";
import { GlossyBeatingHeart } from "@/components/marketing/glossy-beating-heart";
import { type OrbTheme } from "@/components/marketing/orb-theme";
import { cn } from "@/lib/utils";

const NilaOrbCanvas = dynamic(() => import("@/components/marketing/nila-orb-canvas"), {
  ssr: false,
  loading: () => null,
});

function canUseWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function OrbFallback({ theme, className }: { theme: OrbTheme; className?: string }) {
  const orbGradient =
    theme === "dark"
      ? "radial-gradient(circle at 50% 45%, rgba(255,100,150,0.55), rgba(185,174,222,0.32) 55%, transparent 72%)"
      : "radial-gradient(circle at 50% 45%, rgba(255,140,170,0.6), rgba(242,146,111,0.28) 50%, rgba(155,127,212,0.18) 65%, transparent 75%)";

  return (
    <div className={cn("flex h-full w-full items-center justify-center", className)} aria-hidden>
      <div
        className="flex size-[min(72vw,320px)] items-center justify-center rounded-full sm:size-[min(68vw,360px)]"
        style={{ background: orbGradient }}
      >
        <GlossyBeatingHeart size={168} />
      </div>
    </div>
  );
}

interface NilaOrbProps {
  className?: string;
}

export function NilaOrb({ className }: NilaOrbProps) {
  const reduced = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(false);
  const { ref, size, ready } = useContainerSize<HTMLDivElement>();

  useEffect(() => {
    setMounted(true);
    setWebglOk(canUseWebGL());
  }, []);

  const orbTheme: OrbTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  if (!mounted || !ready) {
    return (
      <div
        ref={ref}
        className={cn(className, "min-h-[280px] animate-pulse rounded-full bg-primary/8")}
        aria-hidden
      />
    );
  }

  if (reduced || !webglOk) {
    return (
      <div ref={ref} className={className} aria-hidden>
        <OrbFallback theme={orbTheme} />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn(className, "min-h-[280px]")} aria-hidden>
      <NilaOrbCanvas theme={orbTheme} width={size.width} height={size.height} />
    </div>
  );
}
