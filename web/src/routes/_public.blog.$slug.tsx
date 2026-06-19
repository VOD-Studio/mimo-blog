import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/blog/$slug")({
  component: BlogDetailPage,
});

/**
 * 博客详情页占位
 */
function BlogDetailPage() {
  const { slug } = Route.useParams();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">文章详情</h1>
      <p className="text-muted-foreground">Slug: {slug}</p>
    </div>
  );
}
