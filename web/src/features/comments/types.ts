/**
 * 评论状态
 */
export type CommentStatus = "pending" | "approved" | "spam" | "deleted";

/**
 * 评论 DTO
 */
export interface Comment {
  /** 评论 ID */
  id: string;
  /** 文章 ID */
  post_id: string;
  /** 父评论 ID */
  parent_id?: string;
  /** 层级深度 */
  depth: number;
  /** 作者名 */
  author_name: string;
  /** 作者头像 */
  avatar_url?: string;
  /** 评论内容 */
  body: string;
  /** 配图 */
  pictures: string[];
  /** 状态 */
  status: CommentStatus;
  /** 创建时间 */
  created_at: string;
}

/**
 * 提交评论请求
 */
export interface CreateCommentInput {
  /** 评论内容 */
  body: string;
  /** 父评论 ID */
  parent_id?: string;
  /** 作者名 */
  author_name: string;
  /** 作者邮箱 */
  author_email: string;
  /** 作者主页 */
  author_url?: string;
  /** 作者头像 */
  avatar_url?: string;
}
