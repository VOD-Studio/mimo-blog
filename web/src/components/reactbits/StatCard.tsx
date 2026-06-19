"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { BentoCard } from "./BentoCard";

interface StatCardProps {
  value: number;
  label: string;
  icon?: ReactNode;
  suffix?: string;
  className?: string;
}

/**
 * Bento 数据卡片
 */
export function StatCard({ value, label, icon, suffix = "", className }: StatCardProps) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(display);

  useEffect(() => {
    displayRef.current = display;
  });

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const startValue = displayRef.current;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - (1 - progress) ** 3;
      setDisplay(Math.floor(startValue + (value - startValue) * ease));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <BentoCard className={cn("justify-between", className)}>
      {icon && <div className="mb-4 text-primary">{icon}</div>}
      <div>
        <div className="text-4xl font-bold tracking-tight">
          {display}
          {suffix}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </div>
    </BentoCard>
  );
}
