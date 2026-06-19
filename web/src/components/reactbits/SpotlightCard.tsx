"use client";

import { type ReactNode, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})` | string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  onClick?: () => void;
}

/**
 * ReactBits SpotlightCard
 *
 * 鼠标移动时产生跟随光晕，营造玻璃展台质感。
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(59, 130, 246, 0.15)",
  colSpan = 1,
  rowSpan = 1,
  onClick,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => setOpacity(0.6);
  const handleMouseLeave = () => setOpacity(0);

  const spanClasses = {
    col: {
      1: "",
      2: "md:col-span-2",
      3: "md:col-span-3",
    },
    rowSpan: {
      1: "",
      2: "md:row-span-2",
    },
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: conditional interactive role is set via props
    <div
      ref={divRef}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          onClick();
        }
      }}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-muted/70 p-6 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-300 ease-out dark:bg-card/70",
        "hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-primary/[0.07]",
        spanClasses.col[colSpan],
        spanClasses.rowSpan[rowSpan],
        onClick && "cursor-pointer text-left",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
