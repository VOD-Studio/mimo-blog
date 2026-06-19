import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loading } from "@/components/shared/Loading";
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
        <Loading />
      </div>
    );
  }

  if (!data) {
    return <div className="container mx-auto px-4 py-12">文章不存在</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <PostContent post={data} />
        <TableOfContents />
      </div>
    </div>
  );
}
