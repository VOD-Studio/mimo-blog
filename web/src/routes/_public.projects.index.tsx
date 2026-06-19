import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FolderGit2 } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
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
      <PageHeader
        title="项目"
        description="精选的一些实践与探索，涵盖 Web 应用、工具与实验性项目。"
      />

      {isLoading ? (
        <SkeletonCardGrid count={9} />
      ) : projects.length > 0 ? (
        <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderGit2}
          title="暂无项目"
          description="作者正在准备新的项目展示，敬请期待"
        />
      )}
    </div>
  );
}
