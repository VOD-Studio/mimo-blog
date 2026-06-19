import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/projects/")({
  component: ProjectsPage,
});

/**
 * 项目列表页占位
 */
function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">项目</h1>
      <p className="text-muted-foreground">项目列表即将呈现。</p>
    </div>
  );
}
