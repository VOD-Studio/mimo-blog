"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * ReactBits 风格玻璃拟态卡片
 */
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-30 blur-3xl dark:from-white/5" />
      {children}
    </div>
  );
}
