import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">项目</h1>
      {isLoading ? (
        <SkeletonCardGrid count={9} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((project, index) => (
            <ScrollReveal key={project.id} delay={index * 80}>
              <ProjectCard project={project} />
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
