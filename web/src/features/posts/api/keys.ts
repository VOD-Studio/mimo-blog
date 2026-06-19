/**
 * 文章模块 query key 工厂
 */
export const postKeys = {
  lists: () => ["posts", "list"] as const,
  list: (filters: Record<string, unknown>) => [...postKeys.lists(), filters] as const,
  details: () => ["posts", "detail"] as const,
  detail: (slug: string) => [...postKeys.details(), slug] as const,
};
