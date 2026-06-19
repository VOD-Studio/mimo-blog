"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** 是否作为网格跨列的大卡片 */
  colSpan?: 1 | 2 | 3;
  /** 是否作为网格跨行的大卡片 */
  rowSpan?: 1 | 2;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * Bento 风格卡片
 *
 * 大圆角、毛玻璃、hover 上浮与发光。
 */
export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  onClick,
}: BentoCardProps) {
  const spanClasses = {
    col: {
      1: "",
      2: "md:col-span-2",
      3: "md:col-span-3",
    },
    row: {
      1: "",
      2: "md:row-span-2",
    },
  };

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-muted/70 p-6 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-300 ease-out dark:bg-card/70",
        "hover:-translate-y-1 hover:bg-muted/90 hover:shadow-xl hover:shadow-primary/[0.07] dark:hover:bg-card/90",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-primary/[0.03] before:to-transparent before:opacity-0 before:transition-opacity hover:before:opacity-100",
        spanClasses.col[colSpan],
        spanClasses.row[rowSpan],
        onClick && "cursor-pointer text-left",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </Comp>
  );
}
