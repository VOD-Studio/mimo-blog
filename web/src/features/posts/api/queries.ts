import { api, type ListResponse } from "@/lib/api";

import type { Post, PostSummary } from "../types";

/**
 * 获取文章列表
 */
export async function fetchPosts(params?: {
  page?: number;
  limit?: number;
  tag?: string;
}): Promise<ListResponse<PostSummary>> {
  const response = await api.get("/api/v1/posts", { params });
  return response.data as ListResponse<PostSummary>;
}

/**
 * 根据 slug 获取文章详情
 */
export async function fetchPostBySlug(slug: string): Promise<Post> {
  const response = await api.get(`/api/v1/posts/${slug}`);
  return response.data as Post;
}

/**
 * 增加文章浏览量
 */
export async function incrementPostView(id: string): Promise<void> {
  await api.post(`/api/v1/posts/${id}/view`);
}
