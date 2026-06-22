import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  FolderGit2,
  Headphones,
  Mail,
  Music,
  Sparkles,
  User,
} from "lucide-react";

import { AuroraBackground } from "@/components/reactbits/AuroraBackground";
import { BorderGlow } from "@/components/reactbits/BorderGlow";
import { GradientText } from "@/components/reactbits/GradientText";
import { RippleButton } from "@/components/reactbits/RippleButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { musicKeys } from "@/features/music/api/keys";
import { fetchActivePlaylists } from "@/features/music/api/queries";
import { postKeys } from "@/features/posts/api/keys";
import { fetchPosts } from "@/features/posts/api/queries";
import { projectKeys } from "@/features/projects/api/keys";
import { fetchProjects } from "@/features/projects/api/queries";
import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_public/")({
  component: HomePage,
});

function HomePage() {
  const { data: settings, isLoading: isSettingsLoading } = usePublicSettings();
  const [
    { data: posts, isLoading: isPostsLoading },
    { data: projects, isLoading: isProjectsLoading },
    { data: playlists, isLoading: isMusicLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: postKeys.list({ page: 1, limit: 3 }),
        queryFn: () => fetchPosts({ page: 1, limit: 3 }),
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: projectKeys.lists(),
        queryFn: fetchProjects,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: musicKeys.activePlaylists(),
        queryFn: fetchActivePlaylists,
        staleTime: 5 * 60 * 1000,
      },
    ],
  });

  const siteName = settings?.site_name ?? "Mimo";
  const siteDescription = settings?.site_description ?? "记录技术、设计与生活的数字花园。";
  const postCount = posts?.meta?.pagination?.total ?? 0;
  const projectCount = projects?.length ?? 0;
  const recentPosts = posts?.data ?? [];
  const recentProjects = projects?.slice(0, 2) ?? [];
  const currentSong = playlists?.[0]?.songs?.[0];

  const hasAnyContent = postCount > 0 || projectCount > 0 || currentSong !== undefined;
  const isStatsVisible = hasAnyContent && !isPostsLoading && !isProjectsLoading && !isMusicLoading;

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* Hero */}
      <AuroraBackground
        className="rounded-3xl"
        colorStops={["#3b82f6", "#8b5cf6", "#ec4899"]}
        amplitude={1.0}
        blend={0.5}
      >
        <section className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              在线
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
              <GradientText
                colors={["#3b82f6", "#8b5cf6", "#ec4899", "#3b82f6"]}
                animationSpeed={10}
                className="cursor-default"
              >
                {`欢迎来到 ${siteName}`}
              </GradientText>
            </h1>

            <div className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              {isSettingsLoading ? (
                <Skeleton className="mx-auto h-6 w-3/4" />
              ) : (
                siteDescription
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <RippleButton size="lg" asChild>
                <Link to="/blog">
                  <BookOpen className="mr-2 size-5" />
                  浏览文章
                </Link>
              </RippleButton>
              <RippleButton size="lg" variant="outline" asChild>
                <Link to="/about">
                  <User className="mr-2 size-5" />
                  关于我
                </Link>
              </RippleButton>
            </div>
          </div>
        </section>
      </AuroraBackground>

      <div className="container mx-auto px-4">
        {/* Stats */}
        {isStatsVisible && (
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatItem value={postCount} label="文章" icon={BookOpen} />
            <StatItem value={projectCount} label="项目" icon={FolderGit2} />
            <StatItem value={playlists?.length ?? 0} label="歌单" icon={Music} />
            <StatItem value={0} label="灵感" icon={Sparkles} decorative />
          </div>
        )}

        {/* Bento Content */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Posts */}
          <BorderGlow className="md:col-span-2">
            <div className="flex items-center justify-between border-b border-border/50 p-5">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <h2 className="font-semibold">最近文章</h2>
              </div>
              <RippleButton variant="ghost" size="sm" asChild>
                <Link to="/blog">
                  全部
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </RippleButton>
            </div>
            <div className="divide-y divide-border/50">
              {isPostsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                  <div key={index} className="flex items-center gap-4 p-5">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="group flex items-center gap-4 p-5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-lg font-bold text-muted-foreground">
                      {post.title.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium group-hover:text-primary">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {post.published_at ? formatDate(post.published_at) : "未发布"} ·{" "}
                        {post.view_count} 阅读
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))
              ) : (
                <div className="p-5">
                  <EmptyState
                    variant="compact"
                    icon={BookOpen}
                    title="暂无文章"
                    description="作者正在创作中"
                    action={{ label: "查看全部", href: "/blog" }}
                  />
                </div>
              )}
            </div>
          </BorderGlow>

          {/* Music Widget */}
          <BorderGlow className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border/50 p-5">
              <Headphones className="size-5 text-primary" />
              <h2 className="font-semibold">正在听</h2>
            </div>
            <div className="flex flex-1 flex-col p-5">
              {isMusicLoading ? (
                <div className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : currentSong ? (
                <>
                  <div className="aspect-square overflow-hidden rounded-2xl">
                    <img
                      src={
                        currentSong.cover ?? "https://placehold.co/400x400/1e293b/ffffff?text=Music"
                      }
                      alt={currentSong.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="truncate font-medium">{currentSong.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{currentSong.artist}</p>
                  </div>
                  <RippleButton variant="outline" className="mt-4 w-full" asChild>
                    <Link to="/music">
                      <Music className="mr-2 size-4" />
                      打开播放器
                    </Link>
                  </RippleButton>
                </>
              ) : (
                <EmptyState
                  variant="compact"
                  icon={Headphones}
                  title="暂无音乐"
                  description="作者还没准备好音乐列表"
                  action={{ label: "前往音乐页", href: "/music" }}
                />
              )}
            </div>
          </BorderGlow>

          {/* Projects */}
          {isProjectsLoading
            ? Array.from({ length: 2 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                <BorderGlow key={index} className="p-5">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="mt-3 h-16 w-full" />
                  <Skeleton className="mt-4 h-8 w-2/3" />
                </BorderGlow>
              ))
            : recentProjects.map((project) => (
                <BorderGlow key={project.id} className="flex flex-col p-5">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="size-5 text-primary" />
                    <h2 className="font-semibold">{project.title}</h2>
                  </div>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                  <RippleButton variant="ghost" size="sm" className="mt-4 self-start" asChild>
                    <Link to="/projects">查看项目</Link>
                  </RippleButton>
                </BorderGlow>
              ))}

          {recentProjects.length === 0 && !isProjectsLoading && (
            <BorderGlow className="p-5">
              <EmptyState
                variant="compact"
                icon={FolderGit2}
                title="暂无项目"
                description="作者正在准备中"
                action={{ label: "查看全部", href: "/projects" }}
              />
            </BorderGlow>
          )}

          {/* About / Contact */}
          <BorderGlow className="flex flex-col items-center justify-center p-6 text-center max-md:col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-7 text-primary" />
            </div>
            <h2 className="mt-4 font-semibold">保持联系</h2>
            <p className="mt-1 text-sm text-muted-foreground">有问题或合作想法？随时联系。</p>
            <RippleButton variant="outline" className="mt-4" asChild>
              <Link to="/about">关于我</Link>
            </RippleButton>
          </BorderGlow>
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  decorative?: boolean;
}

function StatItem({ value, label, icon: Icon, decorative }: StatItemProps) {
  return (
    <BorderGlow className="flex items-center gap-4 p-4" glowColor="200 80 60">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{decorative ? "∞" : value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </BorderGlow>
  );
}
