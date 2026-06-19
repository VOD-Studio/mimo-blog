import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/blog/")({
  component: BlogListPage,
});

/**
 * 博客列表页占位
 */
function BlogListPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">博客</h1>
      <p className="text-muted-foreground">博客列表即将呈现。</p>
    </div>
  );
}
