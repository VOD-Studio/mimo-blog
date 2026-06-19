import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FolderGit2, Headphones, Mail, Music, User } from "lucide-react";

import { BentoCard } from "@/components/reactbits/BentoCard";
import { BentoGrid } from "@/components/reactbits/BentoGrid";
import { GradientText } from "@/components/reactbits/GradientText";
import { MagneticButton } from "@/components/reactbits/MagneticButton";
import { StatCard } from "@/components/reactbits/StatCard";
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

/**
 * 首页
 *
 * Bento 模块化布局：大卡片 + 小部件 + 数据统计。
 */
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
  const postCount = posts?.meta.pagination.total ?? 0;
  const projectCount = projects?.length ?? 0;
  const recentPosts = posts?.data ?? [];
  const recentProjects = projects?.slice(0, 2) ?? [];
  const currentSong = playlists?.[0]?.songs?.[0];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <BentoGrid columns={3} className="max-w-6xl">
        {/* Hero */}
        <BentoCard colSpan={2} rowSpan={2} className="justify-between p-8 md:p-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              在线
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              <GradientText>欢迎来到 {siteName}</GradientText>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              {isSettingsLoading ? <Skeleton className="h-6 w-full" /> : siteDescription}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagneticButton asChild>
              <Link to="/blog">
                <BookOpen className="mr-2 size-4" />
                浏览文章
              </Link>
            </MagneticButton>
            <MagneticButton variant="outline" asChild>
              <Link to="/about">
                <User className="mr-2 size-4" />
                关于我
              </Link>
            </MagneticButton>
          </div>
        </BentoCard>

        {/* Stats */}
        <StatCard value={postCount} label="文章" icon={<BookOpen className="size-6" />} />
        <StatCard value={projectCount} label="项目" icon={<FolderGit2 className="size-6" />} />

        {/* Recent Posts */}
        <BentoCard colSpan={2} className="p-0">
          <div className="flex items-center justify-between border-b border-border/50 p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <h2 className="font-semibold">最近文章</h2>
            </div>
            <MagneticButton variant="ghost" size="sm" asChild>
              <Link to="/blog">
                全部
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </MagneticButton>
          </div>
          <div className="divide-y divide-border/50">
            {isPostsLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                  <div key={index} className="flex items-center gap-4 p-5">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              : recentPosts.map((post) => (
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
                      <h3 className="truncate font-medium group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {post.published_at ? formatDate(post.published_at) : "未发布"} ·{" "}
                        {post.view_count} 阅读
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
          </div>
        </BentoCard>

        {/* Music Widget */}
        <BentoCard className="justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="size-5 text-primary" />
            <h2 className="font-semibold">正在听</h2>
          </div>
          {isMusicLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : currentSong ? (
            <>
              <div className="mt-4 aspect-square overflow-hidden rounded-2xl">
                <img
                  src={currentSong.cover ?? "https://placehold.co/400x400/1e293b/ffffff?text=Music"}
                  alt={currentSong.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mt-4">
                <p className="truncate font-medium">{currentSong.name}</p>
                <p className="truncate text-sm text-muted-foreground">{currentSong.artist}</p>
              </div>
              <MagneticButton variant="outline" className="mt-4 w-full" asChild>
                <Link to="/music">
                  <Music className="mr-2 size-4" />
                  打开播放器
                </Link>
              </MagneticButton>
            </>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>暂无音乐</p>
              <MagneticButton variant="outline" className="mt-4 w-full" asChild>
                <Link to="/music">前往音乐页</Link>
              </MagneticButton>
            </div>
          )}
        </BentoCard>

        {/* Projects */}
        {isProjectsLoading
          ? Array.from({ length: 2 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
              <BentoCard key={index}>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="mt-3 h-16 w-full" />
                <Skeleton className="mt-4 h-8 w-2/3" />
              </BentoCard>
            ))
          : recentProjects.map((project) => (
              <BentoCard key={project.id}>
                <div className="flex items-center gap-2">
                  <FolderGit2 className="size-5 text-primary" />
                  <h2 className="font-semibold">{project.title}</h2>
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {project.description}
                </p>
                <MagneticButton variant="ghost" size="sm" className="mt-4 self-start" asChild>
                  <Link to="/projects">查看项目</Link>
                </MagneticButton>
              </BentoCard>
            ))}

        {/* About / Contact */}
        <BentoCard className="items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-7 text-primary" />
          </div>
          <h2 className="mt-4 font-semibold">保持联系</h2>
          <p className="mt-1 text-sm text-muted-foreground">有问题或合作想法？随时联系。</p>
          <MagneticButton variant="outline" className="mt-4" asChild>
            <Link to="/about">关于我</Link>
          </MagneticButton>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}
