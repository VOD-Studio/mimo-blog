import { createFileRoute } from "@tanstack/react-router";
import { Code2, Fingerprint, Rocket } from "lucide-react";
import { GitHubContributions } from "@/components/reactbits/GitHubContributions";
import { GlassCard } from "@/components/reactbits/GlassCard";
import { GradientText } from "@/components/reactbits/GradientText";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { TextReveal } from "@/components/reactbits/TextReveal";
import { TiltCard } from "@/components/reactbits/TiltCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
});

const FALLBACK_BIO = "热爱技术与设计，致力于构建优雅且高性能的 Web 应用。";

/**
 * 关于页
 */
function AboutPage() {
  const { data: settings, isLoading } = usePublicSettings();

  const siteName = settings?.site_name ?? "My Blog";
  const bio = settings?.bio ?? FALLBACK_BIO;
  const techStack = settings?.tech_stack
    ? settings.tech_stack
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const githubUsername = settings?.github_username;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <ScrollReveal>
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent-brand text-3xl font-bold text-white shadow-xl">
            {siteName.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <GradientText>关于 {siteName}</GradientText>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            {isLoading ? (
              <Skeleton className="mx-auto h-8 w-4/5" />
            ) : (
              <TextReveal text={bio} delay={25} />
            )}
          </p>
        </section>
      </ScrollReveal>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
        <ScrollReveal delay={100}>
          <GlassCard className="h-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Fingerprint className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">个人简介</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              全栈开发者，关注用户体验与代码质量，喜欢用简洁方案解决复杂问题。
            </p>
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <GlassCard className="h-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Code2 className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">技术热爱</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              深耕 React / Go 生态，持续探索前端工程化、云原生与 DevOps 实践。
            </p>
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <GlassCard className="h-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">持续交付</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              信奉自动化测试、CI/CD 与可维护架构，让产品快速而稳定地演进。
            </p>
          </GlassCard>
        </ScrollReveal>
      </div>

      <ScrollReveal className="mx-auto mt-16 max-w-5xl" delay={400}>
        <GlassCard>
          <h2 className="mb-6 text-2xl font-bold">技术栈</h2>
          {isLoading ? (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                <Skeleton key={index} className="h-9 w-20 rounded-full" />
              ))}
            </div>
          ) : techStack.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {techStack.map((tech) => (
                <TiltCard key={tech} tiltAmount={12}>
                  <div className="rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium shadow-sm">
                    {tech}
                  </div>
                </TiltCard>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              暂无技术栈数据，可在后台站点设置中配置。
            </p>
          )}
        </GlassCard>
      </ScrollReveal>

      <ScrollReveal className="mx-auto mt-6 max-w-5xl" delay={500}>
        <GitHubContributions username={githubUsername} />
      </ScrollReveal>
    </div>
  );
}
