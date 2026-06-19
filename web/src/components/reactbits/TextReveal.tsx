"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  /** 每个字符出现间隔（毫秒） */
  delay?: number;
  /** 是否触发显示 */
  trigger?: boolean;
}

/**
 * ReactBits 风格逐字文本揭示效果
 */
export function TextReveal({ text, className, delay = 30, trigger = true }: TextRevealProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!trigger) {
      setVisibleCount(0);
      return;
    }

    setVisibleCount(0);
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setVisibleCount(index);
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay, trigger]);

  return (
    <span className={cn("inline-block", className)}>
      {text.split("").map((char, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: characters are stable for the same text
          key={index}
          className={cn(
            "inline-block transition-all duration-300",
            index < visibleCount ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
