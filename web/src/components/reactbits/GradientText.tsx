import { cn } from "@/lib/utils";

interface GradientTextProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 额外类名 */
  className?: string;
}

/**
 * ReactBits 风格渐变文字
 */
export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-gradient-to-r from-brand via-accent-brand to-brand bg-[length:200%_auto] bg-clip-text text-transparent",
        "animate-gradient-x",
        className,
      )}
    >
      {children}
    </span>
  );
}
