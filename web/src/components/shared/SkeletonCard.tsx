/**
 * Bento 风格卡片骨架屏
 */
export function SkeletonCard() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-muted/70 p-5 dark:bg-card/70">
      <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
      <div className="space-y-3">
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
