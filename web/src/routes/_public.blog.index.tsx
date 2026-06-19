import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SkeletonCardGrid } from "@/components/shared/SkeletonCardGrid";
import { postKeys } from "@/features/posts/api/keys";
import { fetchPosts } from "@/features/posts/api/queries";
import { PostCard } from "@/features/posts/components/PostCard";

export const Route = createFileRoute("/_public/blog/")({
  component: BlogListPage,
});

/**
 * 博客列表页
 */
function BlogListPage() {
  const { data, isLoading } = useQuery({
    queryKey: postKeys.list({ page: 1, limit: 12 }),
    queryFn: () => fetchPosts({ page: 1, limit: 12 }),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">博客</h1>
      {isLoading ? (
        <SkeletonCardGrid count={12} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
