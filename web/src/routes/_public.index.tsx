import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  component: HomePage,
});

/**
 * 首页占位
 */
function HomePage() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Mimo Blog</h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        记录技术、设计与生活的数字花园。
      </p>
    </div>
  );
}
