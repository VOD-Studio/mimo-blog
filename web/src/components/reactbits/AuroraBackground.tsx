import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  /** 子元素 */
  children?: React.ReactNode;
  /** 额外类名 */
  className?: string;
}

/**
 * ReactBits Aurora 背景效果
 */
export function AuroraBackground({ children, className }: AuroraBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-[50%] -top-[50%] h-[200%] w-[200%] animate-aurora bg-gradient-to-r from-brand via-accent-brand to-transparent" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
