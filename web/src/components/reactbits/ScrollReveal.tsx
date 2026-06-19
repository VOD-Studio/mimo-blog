"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  /** 子元素 */
  children: ReactNode;
  /** 额外类名 */
  className?: string;
  /** 动画方向 */
  direction?: "up" | "down" | "left" | "right";
  /** 延迟（毫秒） */
  delay?: number;
}

/**
 * ReactBits 风格滚动进场动画
 */
export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const directionClass = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
  }[direction];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-x-0 translate-y-0 opacity-100" : `opacity-0 ${directionClass}`,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
