import { api } from "@/lib/api";

import type { PostDetail, PostSummary } from "../types";

/**
 * 获取文章列表
 */
export async function fetchPosts(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: PostSummary[]; total: number }> {
  const response = await api.get("/posts", { params });
  return response.data as { items: PostSummary[]; total: number };
}

/**
 * 根据 slug 获取文章详情
 */
export async function fetchPostBySlug(slug: string): Promise<PostDetail> {
  const response = await api.get(`/posts/${slug}`);
  return response.data as PostDetail;
}
