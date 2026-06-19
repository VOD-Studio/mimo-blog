import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Code2, Fingerprint, Github, Mail, MapPin, Music, Rocket } from "lucide-react";

import { BentoCard } from "@/components/reactbits/BentoCard";
import { BentoGrid } from "@/components/reactbits/BentoGrid";
import { GitHubContributions } from "@/components/reactbits/GitHubContributions";
import { GradientText } from "@/components/reactbits/GradientText";
import { MagneticButton } from "@/components/reactbits/MagneticButton";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { TextReveal } from "@/components/reactbits/TextReveal";
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
        <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <GradientText>关于</GradientText>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">关于我、我的技术栈与创作。</p>
        </header>
      </ScrollReveal>

      <BentoGrid columns={3} className="max-w-6xl">
        {/* Profile */}
        <BentoCard colSpan={2} rowSpan={2} className="justify-between p-8">
          <div>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-accent-brand text-3xl font-bold text-white shadow-xl">
              {siteName.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-3xl font-bold">{siteName}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <TextReveal text={bio} delay={25} />
              )}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagneticButton variant="outline" asChild>
              <Link to="/blog">
                <Briefcase className="mr-2 size-4" />
                博客
              </Link>
            </MagneticButton>
            <MagneticButton variant="outline" asChild>
              <Link to="/music">
                <Music className="mr-2 size-4" />
                音乐
              </Link>
            </MagneticButton>
          </div>
        </BentoCard>

        {/* Info cards */}
        <BentoCard>
          <Fingerprint className="size-6 text-primary" />
          <h3 className="mt-4 font-semibold">全栈开发者</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            关注用户体验与代码质量，用简洁方案解决复杂问题。
          </p>
        </BentoCard>

        <BentoCard>
          <Code2 className="size-6 text-primary" />
          <h3 className="mt-4 font-semibold">技术热爱</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            深耕 React / Go 生态，持续探索前端工程化与云原生。
          </p>
        </BentoCard>

        <BentoCard>
          <Rocket className="size-6 text-primary" />
          <h3 className="mt-4 font-semibold">持续交付</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            信奉自动化测试、CI/CD 与可维护架构，让产品稳定演进。
          </p>
        </BentoCard>

        <BentoCard>
          <MapPin className="size-6 text-primary" />
          <h3 className="mt-4 font-semibold">远程创作</h3>
          <p className="mt-2 text-sm text-muted-foreground">在任何有网络的地方工作、学习与分享。</p>
        </BentoCard>

        {/* Tech Stack */}
        <BentoCard colSpan={2}>
          <div className="flex items-center gap-2">
            <Code2 className="size-5 text-primary" />
            <h2 className="font-semibold">技术栈</h2>
          </div>
          {isLoading ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                <Skeleton key={index} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          ) : techStack.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">暂无技术栈数据。</p>
          )}
        </BentoCard>

        {/* Contact */}
        <BentoCard className="items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-7 text-primary" />
          </div>
          <h2 className="mt-4 font-semibold">保持联系</h2>
          <p className="mt-1 text-sm text-muted-foreground">有问题或合作想法？随时联系。</p>
          <MagneticButton variant="outline" className="mt-4" asChild>
            <a href={`mailto:hello@${siteName.toLowerCase().replace(/\s+/g, "-")}.com`}>发邮件</a>
          </MagneticButton>
        </BentoCard>

        {/* GitHub */}
        <BentoCard colSpan={3} className="p-0">
          <div className="flex items-center gap-2 border-b border-border/50 p-5">
            <Github className="size-5 text-primary" />
            <h2 className="font-semibold">GitHub 贡献</h2>
          </div>
          <div className="p-5">
            <GitHubContributions username={githubUsername} />
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}
