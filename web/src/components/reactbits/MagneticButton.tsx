"use client";

import { type ReactNode, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  /** 子元素 */
  children: ReactNode;
  /** 额外类名 */
  className?: string;
  /** 磁性强度 */
  strength?: number;
}

/**
 * ReactBits 风格磁性按钮
 */
export function MagneticButton({ children, className, strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * strength;
    const y = (event.clientY - rect.top - rect.height / 2) * strength;
    setPosition({ x, y });
  }

  function handleMouseLeave() {
    setPosition({ x: 0, y: 0 });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn("transition-transform duration-200 ease-out will-change-transform", className)}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
