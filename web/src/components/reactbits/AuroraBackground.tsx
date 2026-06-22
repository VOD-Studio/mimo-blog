"use client";

import { cn } from "@/lib/utils";

import { Aurora } from "./Aurora";

interface AuroraBackgroundProps {
  /** 子元素 */
  children?: React.ReactNode;
  /** 额外类名 */
  className?: string;
  /** 极光颜色停止点 */
  colorStops?: string[];
  /** 振幅 */
  amplitude?: number;
  /** 混合程度 */
  blend?: number;
}

/**
 * ReactBits Aurora 背景包装
 *
 * 使用 WebGL 极光效果作为页面区块背景，比 CSS 渐变更柔和流动。
 */
export function AuroraBackground({
  children,
  className,
  colorStops = ["#3b82f6", "#8b5cf6", "#ec4899"],
  amplitude = 1.2,
  blend = 0.6,
}: AuroraBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <Aurora colorStops={colorStops} amplitude={amplitude} blend={blend} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
