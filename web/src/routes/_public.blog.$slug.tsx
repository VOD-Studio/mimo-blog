import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { postKeys } from "@/features/posts/api/keys";
import { fetchPostBySlug } from "@/features/posts/api/queries";
import { PostContent } from "@/features/posts/components/PostContent";
import { TableOfContents } from "@/features/posts/components/TableOfContents";

export const Route = createFileRoute("/_public/blog/$slug")({
  component: BlogDetailPage,
});

/**
 * 博客详情页
 */
function BlogDetailPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: postKeys.detail(slug),
    queryFn: () => fetchPostBySlug(slug),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="aspect-[2.4/1] w-full rounded-3xl" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-3xl border border-dashed bg-muted/30 p-16 text-center text-muted-foreground">
          文章不存在
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_280px]">
        <PostContent post={data} />
        <TableOfContents contentHtml={data.content_html} />
      </div>
    </div>
  );
}
