import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { GradientText } from "@/components/reactbits/GradientText";
import { MagneticButton } from "@/components/reactbits/MagneticButton";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { SkeletonCardGrid } from "@/components/shared/SkeletonCardGrid";

import { postKeys } from "../api/keys";
import { fetchPosts } from "../api/queries";
import { PostCard } from "./PostCard";

/**
 * 最近文章列表
 */
export function RecentPostsSection() {
  const { data, isLoading } = useQuery({
    queryKey: postKeys.list({ page: 1, limit: 6 }),
    queryFn: () => fetchPosts({ page: 1, limit: 6 }),
  });

  const posts = data?.data ?? [];

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <ScrollReveal>
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold">
              <GradientText>最近文章</GradientText>
            </h2>
            <p className="mt-2 text-muted-foreground">分享最新的思考与技术实践</p>
          </div>
          <MagneticButton variant="outline" asChild>
            <Link to="/blog">
              查看全部
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </MagneticButton>
        </div>
      </ScrollReveal>

      {isLoading ? (
        <SkeletonCardGrid count={6} />
      ) : posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <ScrollReveal key={post.id} delay={index * 80}>
              <PostCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center text-muted-foreground">
          <p>暂无文章，稍后再来看看吧。</p>
        </div>
      )}
    </section>
  );
}
