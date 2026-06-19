import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

/**
 * Bento 网格布局
 */
export function BentoGrid({ children, className, columns = 3 }: BentoGridProps) {
  const cols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <div className={cn("grid auto-rows-min grid-cols-1 gap-4", cols[columns], className)}>
      {children}
    </div>
  );
}
