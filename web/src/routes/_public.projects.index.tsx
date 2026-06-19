import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { GradientText } from "@/components/reactbits/GradientText";
import { ScrollReveal } from "@/components/reactbits/ScrollReveal";
import { SkeletonCardGrid } from "@/components/shared/SkeletonCardGrid";
import { projectKeys } from "@/features/projects/api/keys";
import { fetchProjects } from "@/features/projects/api/queries";
import { ProjectCard } from "@/features/projects/components/ProjectCard";

export const Route = createFileRoute("/_public/projects/")({
  component: ProjectsPage,
});

/**
 * 项目列表页
 */
function ProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: projectKeys.lists(),
    queryFn: fetchProjects,
  });

  const projects = data ?? [];

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <ScrollReveal>
        <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <GradientText>项目</GradientText>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            精选的一些实践与探索，涵盖 Web 应用、工具与实验性项目。
          </p>
        </header>
      </ScrollReveal>

      {isLoading ? (
        <SkeletonCardGrid count={9} />
      ) : projects.length > 0 ? (
        <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <ScrollReveal key={project.id} delay={index * 60}>
              <ProjectCard project={project} featured={index === 0} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed bg-muted/30 p-16 text-center text-muted-foreground">
          暂无项目
        </div>
      )}
    </div>
  );
}
