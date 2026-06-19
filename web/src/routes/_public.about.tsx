"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Github, Mail, Sparkles } from "lucide-react";

import { BentoGrid } from "@/components/reactbits/BentoGrid";
import { RippleButton } from "@/components/reactbits/RippleButton";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
});

/**
 * 关于页
 *
 * 展示站点与个人简介、技术栈、联系方式。
 */
function AboutPage() {
  const { data: settings, isLoading } = usePublicSettings();

  const techStack = settings?.tech_stack
    ? settings.tech_stack
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="关于"
          description={
            isLoading ? (
              <Skeleton className="mx-auto h-6 w-3/4" />
            ) : (
              (settings?.site_description ?? "记录技术、设计与生活的数字花园。")
            )
          }
          align="center"
        />

        <BentoGrid columns={3}>
          {/* Bio */}
          <SpotlightCard colSpan={2} rowSpan={2} className="p-8 md:p-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">你好，我是站长</h2>
            <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-5 w-4/6" />
                </>
              ) : settings?.bio ? (
                <p>{settings.bio}</p>
              ) : (
                <>
                  <p>
                    这里是 {settings?.site_name ?? "Mimo"}
                    ，一个用来沉淀技术笔记、分享项目实践与记录生活灵感的个人空间。
                  </p>
                  <p>相信好的内容应该像 Bento 便当一样：精致、模块化、每一口都有惊喜。</p>
                </>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <RippleButton asChild>
                <Link to="/blog">
                  <ArrowRight className="mr-2 size-4" />
                  浏览文章
                </Link>
              </RippleButton>
              <RippleButton variant="outline" asChild>
                <Link to="/projects">查看项目</Link>
              </RippleButton>
            </div>
          </SpotlightCard>

          {/* Tech Stack */}
          <SpotlightCard className="p-6">
            <h3 className="mb-4 font-semibold">技术栈</h3>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-5/6" />
                <Skeleton className="h-8 w-4/6" />
              </div>
            ) : techStack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无技术栈信息</p>
            )}
          </SpotlightCard>

          {/* Contact */}
          <SpotlightCard className="p-6">
            <h3 className="mb-4 font-semibold">联系方式</h3>
            <div className="space-y-3">
              {settings?.github_username && (
                <a
                  href={`https://github.com/${settings.github_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
                >
                  <Github className="size-5 text-primary" />
                  <span className="text-sm">@{settings.github_username}</span>
                </a>
              )}
              <a
                href="mailto:contact@example.com"
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
              >
                <Mail className="size-5 text-primary" />
                <span className="text-sm">发送邮件</span>
              </a>
            </div>
          </SpotlightCard>

          {/* Stats / Values */}
          <SpotlightCard colSpan={3} className="p-6">
            <div className="grid gap-6 text-center sm:grid-cols-3">
              <div>
                <p className="text-3xl font-bold text-primary">Bento</p>
                <p className="mt-1 text-sm text-muted-foreground">模块化设计</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">Motion</p>
                <p className="mt-1 text-sm text-muted-foreground">细腻动效</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">Content</p>
                <p className="mt-1 text-sm text-muted-foreground">优质内容</p>
              </div>
            </div>
          </SpotlightCard>
        </BentoGrid>
      </div>
    </div>
  );
}
