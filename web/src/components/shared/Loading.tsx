"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  /** 加载提示文本 */
  text?: string;
  /** 额外类名 */
  className?: string;
}

/**
 * 全屏/区块 Loading 指示器
 */
export function Loading({ text = "加载中...", className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
