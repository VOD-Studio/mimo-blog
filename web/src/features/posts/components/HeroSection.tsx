import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";

import { AuroraBackground } from "@/components/reactbits/AuroraBackground";
import { DecryptedText } from "@/components/reactbits/DecryptedText";
import { GradientText } from "@/components/reactbits/GradientText";
import { MagneticButton } from "@/components/reactbits/MagneticButton";
import { ParticleBackground } from "@/components/reactbits/ParticleBackground";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

/**
 * 首页 Hero 区域
 */
export function HeroSection() {
  const { data: settings, isLoading } = usePublicSettings();

  const siteName = settings?.site_name ?? "Mimo Blog";
  const siteDescription = settings?.site_description ?? "记录技术、设计与生活的数字花园。";

  return (
    <AuroraBackground className="relative overflow-hidden py-28 md:py-36">
      <ParticleBackground quantity={50} staticity={70} />
      <div className="container relative z-10 mx-auto px-4 text-center">
        <ScrollReveal>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            <GradientText>{siteName}</GradientText>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground md:text-2xl">
            {isLoading ? (
              <Skeleton className="mx-auto h-8 w-3/4" />
            ) : (
              <DecryptedText text={siteDescription} />
            )}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton asChild className="h-11 px-6 text-base">
              <Link to="/blog">
                <BookOpen className="mr-2 size-4" />
                浏览文章
              </Link>
            </MagneticButton>
            <MagneticButton variant="outline" asChild className="h-11 px-6 text-base">
              <Link to="/about">
                了解更多
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </MagneticButton>
          </div>
        </ScrollReveal>
      </div>
    </AuroraBackground>
  );
}
