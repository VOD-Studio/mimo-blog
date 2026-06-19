import { api } from "@/lib/api";

import type { SiteSettings } from "../types";

/**
 * 获取公开站点配置
 */
export async function fetchPublicSettings(): Promise<SiteSettings> {
  const response = await api.get("/api/v1/settings");
  return response.data as SiteSettings;
}
