import { api } from "@/lib/api";

import type { Project } from "../types";

/**
 * 获取项目列表
 */
export async function fetchProjects(): Promise<Project[]> {
  const response = await api.get("/api/v1/projects");
  return response.data as Project[];
}
