"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface DecryptedTextProps {
  /** 原始文本 */
  text: string;
  /** 额外类名 */
  className?: string;
  /** 动画间隔（毫秒） */
  interval?: number;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

/**
 * ReactBits 风格解密文字动画
 */
export function DecryptedText({ text, className, interval = 30 }: DecryptedTextProps) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let currentIndex = 0;
    const timer = setInterval(() => {
      setDisplay(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < currentIndex) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join(""),
      );
      currentIndex += 1;
      if (currentIndex > text.length) {
        clearInterval(timer);
        setDisplay(text);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [text, interval]);

  return <span className={cn("inline-block", className)}>{display}</span>;
}
