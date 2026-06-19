import { ExternalLink, Github } from "lucide-react";

import { BentoCard } from "@/components/reactbits/BentoCard";
import { MagneticButton } from "@/components/reactbits/MagneticButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { Project } from "../types";

interface ProjectCardProps {
  /** 项目 */
  project: Project;
  /** 是否跨两列 */
  featured?: boolean;
}

/**
 * Bento 风格项目卡片
 */
export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  return (
    <BentoCard className="group p-0" colSpan={featured ? 2 : 1}>
      <div className="flex h-full flex-col">
        {project.image_url ? (
          <div className={cn("overflow-hidden", featured ? "aspect-[2/1]" : "aspect-video")}>
            <img
              src={project.image_url}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className={cn(
              "bg-gradient-to-br from-muted to-muted/50",
              featured ? "aspect-[2/1]" : "aspect-video",
            )}
          />
        )}

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-semibold">{project.title}</h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
            {project.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.tech_stack.slice(0, featured ? 8 : 4).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.url && (
              <MagneticButton variant="outline" size="sm" asChild>
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 size-3.5" />
                  访问
                </a>
              </MagneticButton>
            )}
            {project.github_url && (
              <MagneticButton variant="ghost" size="sm" asChild>
                <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-1 size-3.5" />
                  GitHub
                </a>
              </MagneticButton>
            )}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
