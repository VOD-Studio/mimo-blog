"use client";

import { type ReactNode, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface TiltCardProps {
  /** 子元素 */
  children: ReactNode;
  /** 额外类名 */
  className?: string;
  /** 最大旋转角度 */
  tiltAmount?: number;
}

/**
 * ReactBits 风格 3D 倾斜卡片
 */
export function TiltCard({ children, className, tiltAmount = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
  });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * tiltAmount;
    const rotateY = (x - 0.5) * tiltAmount;
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    });
  }

  function handleMouseLeave() {
    setStyle({ transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)" });
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: decorative 3D tilt hover effect
    <div
      ref={ref}
      className={cn("transition-transform duration-200 ease-out will-change-transform", className)}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
