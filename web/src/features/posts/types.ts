/**
 * 文章状态
 */
export type PostStatus = "draft" | "published" | "archived";

/**
 * 文章 DTO（后端完整字段）
 */
export interface Post {
  /** 文章 ID */
  id: string;
  /** 标题 */
  title: string;
  /** Slug */
  slug: string;
  /** Markdown 正文 */
  content_md: string;
  /** HTML 正文 */
  content_html: string;
  /** 摘要 */
  excerpt: string;
  /** 封面图 URL */
  cover_image?: string;
  /** 状态 */
  status: PostStatus;
  /** 作者 ID */
  author_id: string;
  /** 浏览量 */
  view_count: number;
  /** 是否置顶 */
  is_featured: boolean;
  /** SEO 标题 */
  seo_title?: string;
  /** SEO 描述 */
  seo_description?: string;
  /** 发布时间 */
  published_at?: string;
  /** 标签 */
  tags: string[];
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 文章摘要（列表展示用）
 */
export interface PostSummary {
  /** 文章 ID */
  id: string;
  /** 标题 */
  title: string;
  /** Slug */
  slug: string;
  /** 摘要 */
  excerpt: string;
  /** 封面图 URL */
  cover_image?: string;
  /** 作者 ID */
  author_id: string;
  /** 发布时间 */
  published_at?: string;
  /** 浏览量 */
  view_count: number;
  /** 标签 */
  tags: string[];
}
