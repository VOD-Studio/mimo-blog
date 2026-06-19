"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BentoGrid } from "@/components/reactbits/BentoGrid";
import { RippleButton } from "@/components/reactbits/RippleButton";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { ShinyText } from "@/components/reactbits/ShinyText";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCardGrid } from "@/components/shared/SkeletonCardGrid";
import { Input } from "@/components/ui/input";
import { fetchPosts } from "@/features/posts/api/queries";
import { PostCard } from "@/features/posts/components/PostCard";
import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

export const Route = createFileRoute("/_public/blog/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [search, setSearch] = useState("");
  const { data: postsData, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchPosts({ limit: 100 }),
  });
  const { data: settings } = usePublicSettings();

  const siteName = settings?.site_name ?? "Mimo";

  const filteredPosts = useMemo(() => {
    if (!postsData?.data) return [];
    if (!search.trim()) return postsData.data;
    const term = search.toLowerCase();
    return postsData.data.filter(
      (post) =>
        post.title.toLowerCase().includes(term) || post.excerpt?.toLowerCase().includes(term),
    );
  }, [postsData, search]);

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-8 md:mb-12">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
              <ShinyText>博客</ShinyText>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              探索 {siteName} 的文章、教程与思考
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mb-8" delay={0.1}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索文章..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 bg-background/50 pl-9 backdrop-blur-sm"
              />
            </div>

            {search && (
              <RippleButton variant="outline" size="sm" onClick={() => setSearch("")}>
                清除搜索
              </RippleButton>
            )}
          </div>
        </ScrollReveal>

        {isLoading ? (
          <SkeletonCardGrid count={9} />
        ) : filteredPosts.length > 0 ? (
          <BentoGrid columns={3} className="mt-8">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </BentoGrid>
        ) : (
          <EmptyState
            className="mt-8"
            icon={BookOpen}
            title={search.trim() ? "未找到匹配文章" : "暂无文章"}
            description={
              search.trim() ? "换个关键词试试，或者清除搜索条件" : "稍后再来看看，作者正在创作中"
            }
            action={search.trim() ? { label: "清除搜索", onClick: () => setSearch("") } : undefined}
          />
        )}
      </div>
    </div>
  );
}
