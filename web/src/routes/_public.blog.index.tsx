import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { GradientText } from "@/components/reactbits/GradientText";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { SkeletonCardGrid } from "@/components/shared/SkeletonCardGrid";
import { postKeys } from "@/features/posts/api/keys";
import { fetchPosts } from "@/features/posts/api/queries";
import { PostCard } from "@/features/posts/components/PostCard";

export const Route = createFileRoute("/_public/blog/")({
  component: BlogListPage,
});

/**
 * 博客列表页
 *
 * Bento 模块化卡片网格，首篇文章跨两列展示。
 */
function BlogListPage() {
  const { data, isLoading } = useQuery({
    queryKey: postKeys.list({ page: 1, limit: 12 }),
    queryFn: () => fetchPosts({ page: 1, limit: 12 }),
  });

  const posts = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <ScrollReveal>
        <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <GradientText>博客</GradientText>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">技术笔记、设计思考与生活碎片。</p>
        </header>
      </ScrollReveal>

      {isLoading ? (
        <SkeletonCardGrid count={9} />
      ) : posts.length > 0 ? (
        <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <ScrollReveal key={post.id} delay={index * 60}>
              <PostCard post={post} featured={index === 0} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed bg-muted/30 p-16 text-center text-muted-foreground">
          <p>暂无文章，稍后再来看看吧。</p>
        </div>
      )}
    </div>
  );
}
