import { TiltCard } from "@/components/reactbits/TiltCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Project } from "../types";

interface ProjectCardProps {
  /** 项目 */
  project: Project;
}

/**
 * 项目卡片
 */
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <TiltCard>
      <Card className="h-full transition-colors hover:border-brand/50">
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{project.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tech_stack.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </TiltCard>
  );
}
