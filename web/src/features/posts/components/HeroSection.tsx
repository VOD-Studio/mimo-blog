import { AuroraBackground } from "@/components/reactbits/AuroraBackground";

/**
 * 首页 Hero 区域
 */
export function HeroSection() {
  return (
    <AuroraBackground className="py-24">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Mimo Blog</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          记录技术、设计与生活的数字花园。
        </p>
      </div>
    </AuroraBackground>
  );
}
