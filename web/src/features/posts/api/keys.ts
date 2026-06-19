/**
 * 文章模块 query key 工厂
 */
export const postKeys = {
  lists: () => ["posts", "list"] as const,
  list: (filters: { page?: number; limit?: number; tag?: string }) =>
    [...postKeys.lists(), filters] as const,
  details: () => ["posts", "detail"] as const,
  detail: (slug: string) => [...postKeys.details(), slug] as const,
};
