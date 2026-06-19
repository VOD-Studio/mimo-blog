import { SkeletonCard } from "./SkeletonCard";

interface SkeletonCardGridProps {
  /** 卡片数量 */
  count?: number;
}

/**
 * 卡片网格骨架屏
 */
export function SkeletonCardGrid({ count = 6 }: SkeletonCardGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders are static
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
