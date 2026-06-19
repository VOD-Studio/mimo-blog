import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
});

/**
 * 关于页占位
 */
function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">关于</h1>
      <p className="text-muted-foreground">这里展示个人介绍、技术栈与 GitHub 贡献。</p>
    </div>
  );
}
