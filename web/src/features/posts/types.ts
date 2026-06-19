/**
 * 文章摘要
 */
export interface PostSummary {
  /** 文章 ID */
  id: string;
  /** 标题 */
  title: string;
  /** 摘要 */
  excerpt: string;
  /** 缩略图 */
  cover?: string;
  /** 作者 */
  author: string;
  /** 发布时间 */
  publishedAt: string;
  /** 浏览量 */
  viewCount: number;
  /** Slug */
  slug: string;
}

/**
 * 文章详情
 */
export interface PostDetail extends PostSummary {
  /** 正文 HTML */
  content: string;
  /** 标签 */
  tags: string[];
}
