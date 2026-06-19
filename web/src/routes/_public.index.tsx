import { createFileRoute } from "@tanstack/react-router";

import { HeroSection } from "@/features/posts/components/HeroSection";
import { RecentPostsSection } from "@/features/posts/components/RecentPostsSection";

export const Route = createFileRoute("/_public/")({
  component: HomePage,
});

/**
 * 首页
 */
function HomePage() {
  return (
    <>
      <HeroSection />
      <RecentPostsSection />
    </>
  );
}
